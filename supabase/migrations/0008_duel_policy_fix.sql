-- 0008: Fix infinite recursion in duel RLS policies (realtime 42P17).
--
-- "duel_players visible to participants" queried duel_players itself, so
-- every RLS evaluation that reached it (notably realtime's apply_rls on
-- the supabase_realtime publication) recursed forever:
-- PoolingReplicationError: infinite recursion detected in policy for
-- relation "duel_players". The duels policy is affected too, since its
-- subquery on duel_players triggers the same recursive policy.
--
-- Fix: a SECURITY DEFINER membership helper bypasses RLS on duel_players,
-- and both SELECT policies use it. The interactive RPC paths are already
-- SECURITY DEFINER and unaffected. Clients never select these tables
-- directly (all reads go through RPCs), so no other policies change.

create or replace function public.is_duel_participant(p_duel_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.duel_players
     where duel_id = p_duel_id and player_id = auth.uid()
  )
$$;

-- Only policies (running as authenticated) and the RPCs need this.
revoke execute on function public.is_duel_participant(uuid) from public, anon;
grant  execute on function public.is_duel_participant(uuid) to authenticated;

drop policy if exists "duels visible to participants" on public.duels;
create policy "duels visible to participants" on public.duels for select to authenticated using (
  public.is_duel_participant(id)
);

drop policy if exists "duel_players visible to participants" on public.duel_players;
create policy "duel_players visible to participants" on public.duel_players for select to authenticated using (
  public.is_duel_participant(duel_id)
);
