-- 0010: First correct guess wins the duel immediately.
--
-- apply_guess previously settled only when BOTH players finished, so the
-- solver sat on "You solved it! Waiting for … to finish…" while the
-- opponent kept guessing. Now the duel settles the instant a player
-- solves: settle_duel marks the opponent lost, reveals the word, and
-- awards coins/XP in one shot. Concurrent winners are impossible — the
-- duels row lock serialises submits, so the first solver wins and the
-- second gets 'not-active'.
--
-- If a player runs out of guesses first, the duel stays open for the
-- opponent to finish (their solve wins; both exhausted → draw).

create or replace function public.apply_guess(
  p_duel_id uuid, p_player_id uuid, p_guess text, p_colors jsonb, p_is_solved boolean
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_duel   public.duels%rowtype;
  v_me     public.duel_players%rowtype;
  v_other  public.duel_players%rowtype;
  v_now    timestamptz := now();
  v_elapsed int;
begin
  select * into v_duel from public.duels where id = p_duel_id for update;
  if not found then
    return jsonb_build_object('error', 'not-found');
  end if;
  if v_duel.status <> 'active' then
    return jsonb_build_object('error', 'not-active');
  end if;

  select * into v_me from public.duel_players
   where duel_id = p_duel_id and player_id = p_player_id for update;
  if not found then
    return jsonb_build_object('error', 'not-in-duel');
  end if;
  if v_me.status <> 'playing' then
    return jsonb_build_object('error', 'already-finished');
  end if;

  p_guess := upper(btrim(coalesce(p_guess, '')));
  if char_length(p_guess) <> v_duel.word_length then
    return jsonb_build_object('error', 'bad-length');
  end if;
  if not exists (select 1 from public.guess_words where word = p_guess) then
    return jsonb_build_object('error', 'not-a-word');
  end if;

  insert into public.guesses (duel_id, player_id, guess, colors, attempt_no)
  values (p_duel_id, p_player_id, p_guess, p_colors, v_me.attempts + 1);

  v_me.attempts := v_me.attempts + 1;
  v_me.colors   := v_me.colors || jsonb_build_array(p_colors);
  v_elapsed     := (extract(epoch from (v_now - v_duel.started_at)) * 1000)::int;

  if p_is_solved then
    v_me.status := 'won';
    v_me.finished_at := v_now;
    v_me.time_ms := v_elapsed;
  elsif v_me.attempts >= v_duel.attempts_limit then
    v_me.status := 'lost';
    v_me.finished_at := v_now;
    v_me.time_ms := v_elapsed;
  end if;

  update public.duel_players set
    attempts = v_me.attempts, colors = v_me.colors, status = v_me.status,
    finished_at = v_me.finished_at, time_ms = v_me.time_ms, last_seen = v_now
  where duel_id = p_duel_id and player_id = p_player_id;

  select * into v_other from public.duel_players
   where duel_id = p_duel_id and player_id <> p_player_id;

  -- A solved guess ends the duel NOW: first correct guess wins, the
  -- opponent is marked lost by settle_duel, and coins/XP are awarded
  -- immediately (settle_duel is idempotent — exactly once per duel).
  -- If this player only ran out of guesses, keep the duel open for the
  -- opponent to finish.
  if v_me.status = 'won' then
    perform public.settle_duel(p_duel_id);
  elsif v_other.player_id is not null and v_other.status <> 'playing' and v_me.status <> 'playing' then
    perform public.settle_duel(p_duel_id);
  end if;

  return public.duel_state(p_duel_id);
end $$;
