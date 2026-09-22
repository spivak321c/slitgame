-- 0009: Fix letter_states — runtime failure (42883 jsonb_set not found).
--
-- 0005 was authored but never applied until now, so its PL/pgSQL port of
-- calculateLetterStates was never exercised. jsonb_set's third argument is
-- new_value jsonb, and integer → jsonb is an assignment cast, not an
-- implicit one — so jsonb_set(jsonb, text[], integer) fails to resolve.
--
-- Fix: wrap both count updates in to_jsonb(). The two-pass algorithm is a
-- verbatim port of calculateLetterStates in src/types.ts (absent → exact
-- matches first, then present letters against leftover counts).

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
      counts := jsonb_set(counts, array[ch], to_jsonb(coalesce((counts->>ch)::int, 0) + 1));
    end if;
  end loop;

  -- Pass 2: mark present letters against the leftover counts.
  for i in 1..n loop
    if states[i] <> 'correct' then
      ch := substr(p_guess, i, 1);
      if coalesce((counts->>ch)::int, 0) > 0 then
        states[i] := 'present';
        counts := jsonb_set(counts, array[ch], to_jsonb((counts->>ch)::int - 1));
      end if;
    end if;
  end loop;

  return to_jsonb(states);
end $$;
