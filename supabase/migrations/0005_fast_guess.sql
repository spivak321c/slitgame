-- ────────────────────────────────────────────────────────────────────
-- Phase 4 fix: fast guesses — direct RPC instead of the Edge Function
-- ────────────────────────────────────────────────────────────────────
--
-- The duel flow previously routed every guess through the submit_guess
-- Edge Function (cold starts on the free tier added seconds per guess,
-- and its response omitted my_guesses, forcing an extra refetch).
--
-- This migration moves color computation into PL/pgSQL (a verbatim port
-- of calculateLetterStates in src/types.ts) so the client can call ONE
-- SECURITY DEFINER RPC directly: it verifies the participant, computes
-- the authoritative colors server-side, applies the guess, and returns
-- the complete snapshot (duel + players + my_guesses) in one round trip.
-- The client can still never fabricate a letter outcome.

-- ═══ 1. letter_states — verbatim two-pass port ═════════════════════
create or replace function public.letter_states(p_guess text, p_answer text)
returns jsonb
language plpgsql
immutable
as $$
declare
  n      int := char_length(p_answer);
  states text[] := array_fill('absent'::text, array[n]);
  counts jsonb := '{}'::jsonb;
  i      int;
  ch     text;
begin
  -- Pass 1: mark exact matches, count the answer's leftover letters.
  for i in 1..n loop
    ch := substr(p_answer, i, 1);
    if substr(p_guess, i, 1) = ch then
      states[i] := 'correct';
    else
      counts := jsonb_set(counts, array[ch], coalesce((counts->>ch)::int, 0) + 1);
    end if;
  end loop;

  -- Pass 2: mark present letters against the leftover counts.
  for i in 1..n loop
    if states[i] <> 'correct' then
      ch := substr(p_guess, i, 1);
      if coalesce((counts->>ch)::int, 0) > 0 then
        states[i] := 'present';
        counts := jsonb_set(counts, array[ch], (counts->>ch)::int - 1);
      end if;
    end if;
  end loop;

  return to_jsonb(states);
end $$;

-- ═══ 2. submit_guess_rpc — one-round-trip authoritative guess ══════
create or replace function public.submit_guess_rpc(p_duel_id uuid, p_guess text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member      boolean;
  v_word_length int;
  v_secret      text;
  v_states      jsonb;
  v_result      jsonb;
begin
  -- Verify the caller is a participant BEFORE touching the secret
  -- (never compute colors for a stranger).
  select exists (
    select 1 from public.duel_players
     where duel_id = p_duel_id and player_id = auth.uid()
  ) into v_member;
  if not v_member then
    return jsonb_build_object('error', 'not-in-duel');
  end if;

  select word_length into v_word_length from public.duels where id = p_duel_id;
  if v_word_length is null then
    return jsonb_build_object('error', 'not-found');
  end if;

  p_guess := upper(btrim(coalesce(p_guess, '')));
  if char_length(p_guess) <> v_word_length then
    return jsonb_build_object('error', 'bad-length');
  end if;

  select secret_word into v_secret from public.duel_secrets where duel_id = p_duel_id;
  if v_secret is null then
    return jsonb_build_object('error', 'not-found');
  end if;

  -- Authoritative colors, computed server-side; the client cannot
  -- fabricate an outcome. apply_guess re-validates word/attempts/status
  -- under a row lock and settles + awards when both players finish.
  v_states := public.letter_states(p_guess, v_secret);
  v_result := public.apply_guess(
    p_duel_id, auth.uid(), p_guess, v_states, p_guess = v_secret
  );

  -- apply_guess returns duel_state() without my_guesses; return the full
  -- participant snapshot so the client renders colors with no refetch.
  if v_result ? 'error' then
    return v_result;
  end if;
  return public.get_duel_state(p_duel_id);
end $$;

-- ═══ 3. Grants ══════════════════════════════════════════════════════
revoke execute on function public.submit_guess_rpc(uuid, text) from public, anon;
grant  execute on function public.submit_guess_rpc(uuid, text) to authenticated;

-- letter_states is internal (called by submit_guess_rpc only).
revoke execute on function public.letter_states(text, text) from public, anon, authenticated;