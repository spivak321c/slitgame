-- ────────────────────────────────────────────────────────────────────
-- Phase 4: Social & Ship-hardening — recent opponents + migration fix
-- ────────────────────────────────────────────────────────────────────
--
-- 1. Fixes the Phase 3 `get_daily_word` function, which referenced a
--    `word_bank.is_kid_safe` column that never existed in 0001/0003.
--    This migration adds the column and backfills it (all seeded words
--    are curated and kid-safe), so the function runs without error.
-- 2. Adds `recent_opponents()` — a SECURITY DEFINER RPC that returns the
--    players you've dueled most recently (for the dashboard "Recent
--    Rivals" strip). RLS-safe: it only ever returns duels you're part of.

-- ═══ 1. word_bank.is_kid_safe (fix for 0003's get_daily_word) ════════
alter table public.word_bank
  add column if not exists is_kid_safe boolean not null default true;

-- ═══ 2. recent_opponents — your last finished duels, with the rival ══
create or replace function public.recent_opponents()
returns table (
  opponent_id  uuid,
  username     text,
  avatar       text,
  difficulty   text,
  word_length  integer,
  attempts_limit integer,
  duel_id      uuid,
  finished_at  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    dp.player_id  as opponent_id,
    dp.username   as username,
    dp.avatar     as avatar,
    d.difficulty  as difficulty,
    d.word_length as word_length,
    d.attempts_limit as attempts_limit,
    d.id          as duel_id,
    d.finished_at as finished_at
  from public.duel_players me
  join public.duel_players dp on dp.duel_id = me.duel_id and dp.player_id <> me.player_id
  join public.duels d on d.id = me.duel_id
  where me.player_id = auth.uid()
    and d.status = 'finished'
  order by d.finished_at desc nulls last
  limit 8;
$$;

-- Tighten function grants (same pattern as 0001).
revoke execute on function public.recent_opponents() from public, anon;
grant execute on function public.recent_opponents() to authenticated;