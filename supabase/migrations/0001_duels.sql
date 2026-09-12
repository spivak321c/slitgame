-- ═══════════════════════════════════════════════════════════════════════
-- Slotword — Phase 1: Real 1v1 duel backend
-- Schema · RLS · server-authoritative RPCs (port of server.ts) · Realtime
--
-- Run in the Supabase SQL editor (or `supabase db push`).
-- Design notes:
--   * The secret word lives ONLY in duel_secrets — no anon/authenticated
--     grants and NOT in the realtime publication, so it can never reach
--     a client. duels.revealed_word is set only when a duel finishes.
--   * All game mutations run through SECURITY DEFINER functions that
--     re-validate state under a row lock (FOR UPDATE), which makes
--     double-join, double-settle and guess races impossible.
--   * Duel rules (winner: solved > attempts > time; forfeit on leave;
--     disconnect claim) are ported from the proven server.ts logic.
-- ═══════════════════════════════════════════════════════════════════════

-- ═══ 1. Tables ════════════════════════════════════════════════════════

create table if not exists public.players (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text not null default 'paperpilot',
  avatar        text not null default '🥇',
  coins         integer not null default 100,
  xp            integer not null default 0,
  duels_played  integer not null default 0,
  duels_won     integer not null default 0,
  created_at    timestamptz not null default now(),
  last_seen     timestamptz not null default now()
);

-- Curated kid-safe word bank (seeded at the bottom of this migration).
create table if not exists public.word_bank (
  word        text primary key,
  word_length integer not null,
  difficulty  text not null check (difficulty in ('easy','classic','hard'))
);

create table if not exists public.duels (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique check (char_length(code) = 6),
  difficulty       text not null check (difficulty in ('easy','classic','hard')),
  word_length      integer not null,
  attempts_limit   integer not null,
  status           text not null default 'waiting'
                     check (status in ('waiting','active','finished','cancelled')),
  winner_player_id uuid,                        -- null + is_draw=false → no winner yet
  is_draw          boolean not null default false,
  revealed_word    text,                        -- set when finished; safe for clients
  created_by       uuid not null references public.players(id),
  created_at       timestamptz not null default now(),
  started_at       timestamptz,
  finished_at      timestamptz
);

-- The secret word. No client can ever read this table: no grants for
-- anon/authenticated, no RLS policies, not in the realtime publication.
create table if not exists public.duel_secrets (
  duel_id     uuid primary key references public.duels(id) on delete cascade,
  secret_word text not null
);

create table if not exists public.duel_players (
  duel_id     uuid not null references public.duels(id) on delete cascade,
  player_id   uuid not null references public.players(id) on delete cascade,
  username    text not null default 'paperpilot',   -- frozen at join time
  avatar      text not null default '🥇',
  status      text not null default 'playing' check (status in ('playing','won','lost')),
  attempts    integer not null default 0,
  time_ms     integer,
  colors      jsonb not null default '[]'::jsonb,   -- opponent-visible color grid (never letters)
  left_at     timestamptz,                          -- explicit leave / forfeit
  last_seen   timestamptz not null default now(),   -- heartbeat for disconnect claims
  joined_at   timestamptz not null default now(),
  finished_at timestamptz,
  primary key (duel_id, player_id)
);

create table if not exists public.guesses (
  id         bigint generated always as identity primary key,
  duel_id    uuid not null references public.duels(id) on delete cascade,
  player_id  uuid not null references public.players(id) on delete cascade,
  guess      text not null,
  colors     jsonb not null,
  attempt_no integer not null,
  created_at timestamptz not null default now()
);
create index if not exists guesses_duel_player_idx
  on public.guesses (duel_id, player_id, attempt_no);

-- ═══ 2. Row-Level Security ═════════════════════════════════════════════

alter table public.players      enable row level security;
alter table public.word_bank    enable row level security;
alter table public.duels        enable row level security;
alter table public.duel_secrets enable row level security;
alter table public.duel_players enable row level security;
alter table public.guesses      enable row level security;

-- Supabase grants ALL on public tables to anon/authenticated by default;
-- strip that back so access is exactly what we grant below.
revoke all on public.players, public.duels, public.duel_secrets,
              public.duel_players, public.guesses, public.word_bank
  from anon, authenticated;

-- players: kids can read/claim their own row. coins/xp/duels_* columns are
-- NOT updatable by clients — only SECURITY DEFINER settle code awards them.
grant select (id, username, avatar, coins, xp, duels_played, duels_won, created_at, last_seen)
  on public.players to authenticated;
grant insert (id, username, avatar) on public.players to authenticated;
grant update (username, avatar, last_seen) on public.players to authenticated;

create policy "players read own"      on public.players for select to authenticated using (id = auth.uid());
create policy "players insert own"    on public.players for insert to authenticated with check (id = auth.uid());
create policy "players update own"    on public.players for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- duels / duel_players: visible to participants of that duel only.
grant select on public.duels, public.duel_players to authenticated;

create policy "duels visible to participants" on public.duels for select to authenticated using (
  exists (select 1 from public.duel_players dp
          where dp.duel_id = duels.id and dp.player_id = auth.uid())
);
create policy "duel_players visible to participants" on public.duel_players for select to authenticated using (
  exists (select 1 from public.duel_players me
          where me.duel_id = duel_players.duel_id and me.player_id = auth.uid())
);

-- guesses: your own rows only — opponent letters stay private; opponents
-- see your progress through duel_players.colors (letters are never in it).
grant select on public.guesses to authenticated;
create policy "guesses read own" on public.guesses for select to authenticated using (player_id = auth.uid());

-- duel_secrets + word_bank: intentionally NO grants and NO policies —
-- service role / SECURITY DEFINER only.

-- ═══ 3. Helper: snapshot of a duel (safe columns only) ════════════════

create or replace function public.duel_state(p_duel_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'duel',     to_jsonb(d),
    'players',  (select coalesce(jsonb_agg(to_jsonb(dp) order by dp.joined_at), '[]'::jsonb)
                 from public.duel_players dp where dp.duel_id = p_duel_id)
  )
  from public.duels d where d.id = p_duel_id;
$$;

-- ═══ 4. create_duel — pick word + code server-side, open a room ═══════

create or replace function public.create_duel(p_difficulty text, p_username text, p_avatar text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_len int; v_attempts int;
  v_word text; v_code text; v_duel_id uuid;
begin
  if p_difficulty not in ('easy','classic','hard') then
    return jsonb_build_object('error', 'invalid-difficulty');
  end if;
  v_len      := case p_difficulty when 'easy' then 4 when 'hard' then 6 else 5 end;
  v_attempts := case p_difficulty when 'easy' then 5 when 'hard' then 7 else 6 end;

  select word into v_word from public.word_bank
   where difficulty = p_difficulty order by random() limit 1;
  if v_word is null then
    return jsonb_build_object('error', 'word-bank-empty');
  end if;

  -- Upsert the caller's player row (name/avatar from their local profile).
  insert into public.players (id, username, avatar)
  values (auth.uid(),
          coalesce(nullif(btrim(p_username), ''), 'paperpilot'),
          coalesce(nullif(btrim(p_avatar), ''), '🥇'))
  on conflict (id) do update
    set username = excluded.username, avatar = excluded.avatar, last_seen = now();

  -- 6-char code from an unambiguous alphabet (no I/O/0/1). Retry on the
  -- (astronomically unlikely) unique collision.
  for i in 1..8 loop
    v_code := (
      select string_agg(ch, '') from (
        select (array['A','B','C','D','E','F','G','H','J','K','M','N','P','Q','R','T','U','V','W','X','Y','Z','2','3','4','5','6','7'])
                 [1 + floor(random() * 27)::int] as ch
        from generate_series(1, 6)
      ) s
    );
    begin
      insert into public.duels (code, difficulty, word_length, attempts_limit, created_by)
      values (v_code, p_difficulty, v_len, v_attempts, auth.uid())
      returning id into v_duel_id;
      exit;
    exception when unique_violation then
      v_duel_id := null; -- collision, try another code
    end;
  end loop;

  if v_duel_id is null then
    return jsonb_build_object('error', 'code-collision');
  end if;

  insert into public.duel_secrets (duel_id, secret_word) values (v_duel_id, v_word);
  insert into public.duel_players (duel_id, player_id, username, avatar)
  values (v_duel_id, auth.uid(),
          coalesce(nullif(btrim(p_username), ''), 'paperpilot'),
          coalesce(nullif(btrim(p_avatar), ''), '🥇'));

  return jsonb_build_object('duel_id', v_duel_id, 'code', v_code);
end $$;

-- ═══ 5. join_duel — lock-guarded join; the creator's waiting screen ═══
--   flips to 'active' via Realtime when this row update lands.

create or replace function public.join_duel(p_code text, p_username text, p_avatar text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_duel public.duels%rowtype;
  v_count int;
begin
  insert into public.players (id, username, avatar)
  values (auth.uid(),
          coalesce(nullif(btrim(p_username), ''), 'paperpilot'),
          coalesce(nullif(btrim(p_avatar), ''), '🥇'))
  on conflict (id) do update
    set username = excluded.username, avatar = excluded.avatar, last_seen = now();

  select * into v_duel from public.duels
   where code = upper(btrim(coalesce(p_code, ''))) for update;

  if not found then
    return jsonb_build_object('error', 'not-found');
  end if;

  -- Rejoin after a refresh is fine (creator waiting, or returning mid-match).
  if exists (select 1 from public.duel_players
             where duel_id = v_duel.id and player_id = auth.uid()) then
    return jsonb_build_object('duel_id', v_duel.id, 'code', v_duel.code, 'rejoined', true);
  end if;

  if v_duel.status = 'active'    then return jsonb_build_object('error', 'already-started'); end if;
  if v_duel.status = 'finished'  then return jsonb_build_object('error', 'finished');        end if;
  if v_duel.status = 'cancelled' then return jsonb_build_object('error', 'cancelled');       end if;

  select count(*) into v_count from public.duel_players where duel_id = v_duel.id;
  if v_count >= 2 then
    return jsonb_build_object('error', 'full');
  end if;

  insert into public.duel_players (duel_id, player_id, username, avatar)
  values (v_duel.id, auth.uid(),
          coalesce(nullif(btrim(p_username), ''), 'paperpilot'),
          coalesce(nullif(btrim(p_avatar), ''), '🥇'));

  update public.duels set status = 'active', started_at = now() where id = v_duel.id;

  return jsonb_build_object('duel_id', v_duel.id, 'code', v_duel.code);
end $$;

-- ═══ 6. settle_duel — port of server.ts settleDuel + idempotent awards ═
--   Winner: solved beats unsolved → fewest attempts → fastest time.
--   A player who left/forfeited loses to one who stayed.
--   Awards: winner 2× base coins + full XP · loser 10c/20xp · draw 10c/30xp.

create or replace function public.settle_duel(p_duel_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_duel  public.duels%rowtype;
  p1      public.duel_players%rowtype;
  p2      public.duel_players%rowtype;
  v_winner uuid;
  v_draw   boolean := false;
  v_reward_coins int;
  v_reward_xp int;
begin
  select * into v_duel from public.duels where id = p_duel_id for update;
  if not found or v_duel.status <> 'active' then
    return; -- idempotency guard: settles exactly once per duel
  end if;

  select * into p1 from public.duel_players where duel_id = p_duel_id order by joined_at limit 1;
  select * into p2 from public.duel_players where duel_id = p_duel_id order by joined_at offset 1 limit 1;

  if p2.player_id is null then
    -- Single player left in the room → survivor wins (server.ts rule).
    if p1.player_id is not null then v_winner := p1.player_id; else v_draw := true; end if;
  elsif (p1.left_at is not null) <> (p2.left_at is not null) then
    -- Exactly one player left/forfeited → the one who stayed wins.
    v_winner := case when p1.left_at is null then p1.player_id else p2.player_id end;
  elsif p1.status = 'won' and p2.status <> 'won' then
    v_winner := p1.player_id;
  elsif p2.status = 'won' and p1.status <> 'won' then
    v_winner := p2.player_id;
  elsif p1.status = 'won' and p2.status = 'won' then
    if p1.attempts < p2.attempts then
      v_winner := p1.player_id;
    elsif p2.attempts < p1.attempts then
      v_winner := p2.player_id;
    elsif coalesce(p1.time_ms, 2147483647) < coalesce(p2.time_ms, 2147483647) then
      v_winner := p1.player_id;
    elsif coalesce(p2.time_ms, 2147483647) < coalesce(p1.time_ms, 2147483647) then
      v_winner := p2.player_id;
    else
      v_draw := true;
    end if;
  else
    v_draw := true; -- neither solved
  end if;

  if v_winner is not null then
    update public.duel_players set status = 'won'
     where duel_id = p_duel_id and player_id = v_winner and status = 'playing';
    update public.duel_players set status = 'lost'
     where duel_id = p_duel_id and status = 'playing' and player_id <> v_winner;
  else
    update public.duel_players set status = 'lost'
     where duel_id = p_duel_id and status = 'playing';
  end if;

  update public.duels set
    status        = 'finished',
    finished_at   = now(),
    winner_player_id = v_winner,
    is_draw       = v_draw,
    revealed_word = (select secret_word from public.duel_secrets where duel_id = p_duel_id)
  where id = p_duel_id;

  -- Awards (run only on the active→finished transition above).
  v_reward_coins := case v_duel.difficulty when 'easy' then 30 when 'hard' then 80 else 50 end;
  v_reward_xp    := case v_duel.difficulty when 'easy' then 30 when 'hard' then 80 else 50 end;

  update public.players p set duels_played = p.duels_played + 1
   where p.id in (select player_id from public.duel_players where duel_id = p_duel_id);

  if v_draw then
    update public.players p set coins = p.coins + 10, xp = p.xp + 30
     where p.id in (select player_id from public.duel_players where duel_id = p_duel_id);
  elsif v_winner is not null then
    update public.players p
       set coins = p.coins + v_reward_coins, xp = p.xp + v_reward_xp, duels_won = p.duels_won + 1
     where p.id = v_winner;
    update public.players p set coins = p.coins + 10, xp = p.xp + 20
     where p.id in (select dp.player_id from public.duel_players dp
                    where dp.duel_id = p_duel_id and dp.player_id <> v_winner);
  end if;
end $$;

-- ═══ 7. apply_guess — atomic guess application (service role only) ════
--   Called by the submit_guess Edge Function, which computes the color
--   states in TypeScript (exact port of calculateLetterStates) against
--   the secret. This function owns ALL state mutation under a row lock.

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
  if not exists (select 1 from public.word_bank where word = p_guess) then
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

  if v_other.player_id is not null and v_other.status <> 'playing' and v_me.status <> 'playing' then
    perform public.settle_duel(p_duel_id);
  end if;

  return public.duel_state(p_duel_id);
end $$;

-- ═══ 8. leave_duel — cancel while waiting · forfeit while active ══════

create or replace function public.leave_duel(p_duel_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_duel public.duels%rowtype;
begin
  select * into v_duel from public.duels where id = p_duel_id for update;
  if not found then
    return jsonb_build_object('error', 'not-found');
  end if;
  if not exists (select 1 from public.duel_players
                 where duel_id = p_duel_id and player_id = auth.uid()) then
    return jsonb_build_object('error', 'not-in-duel');
  end if;

  if v_duel.status = 'waiting' then
    delete from public.duel_players where duel_id = p_duel_id and player_id = auth.uid();
    if not exists (select 1 from public.duel_players where duel_id = p_duel_id) then
      update public.duels set status = 'cancelled', finished_at = now() where id = p_duel_id;
    end if;
    return jsonb_build_object('ok', true);
  end if;

  if v_duel.status = 'active' then
    -- Forfeit only if still playing; a finished player leaving must not
    -- hurt their own result (they may already have solved it).
    update public.duel_players
       set status = 'lost', left_at = now(), finished_at = now()
     where duel_id = p_duel_id and player_id = auth.uid() and status = 'playing';
    if found then
      perform public.settle_duel(p_duel_id);
    end if;
    return public.duel_state(p_duel_id);
  end if;

  return public.duel_state(p_duel_id);
end $$;

-- ═══ 9. claim_forfeit — opponent went silent? claim the win ═══════════
--   Requires the opponent to have left explicitly OR their heartbeat to
--   be stale (> 25 s; clients touch every 10 s).

create or replace function public.claim_forfeit(p_duel_id uuid)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_duel  public.duels%rowtype;
  v_other public.duel_players%rowtype;
begin
  select * into v_duel from public.duels where id = p_duel_id for update;
  if not found then
    return jsonb_build_object('error', 'not-found');
  end if;
  if v_duel.status <> 'active' then
    return jsonb_build_object('error', 'not-active');
  end if;
  if not exists (select 1 from public.duel_players
                 where duel_id = p_duel_id and player_id = auth.uid()) then
    return jsonb_build_object('error', 'not-in-duel');
  end if;

  select * into v_other from public.duel_players
   where duel_id = p_duel_id and player_id <> auth.uid();

  if v_other.player_id is null then
    perform public.settle_duel(p_duel_id);
    return public.duel_state(p_duel_id);
  end if;

  if v_other.left_at is null and v_other.last_seen > now() - interval '25 seconds' then
    return jsonb_build_object('error', 'opponent-still-here');
  end if;

  update public.duel_players
     set status = 'lost', left_at = coalesce(left_at, now()), finished_at = now()
   where duel_id = p_duel_id and player_id = v_other.player_id and status = 'playing';

  perform public.settle_duel(p_duel_id);
  return public.duel_state(p_duel_id);
end $$;

-- ═══ 10. touch_duel — presence heartbeat ══════════════════════════════

create or replace function public.touch_duel(p_duel_id uuid)
returns void
language sql security definer set search_path = public as $$
  update public.duel_players set last_seen = now()
   where duel_id = p_duel_id and player_id = auth.uid();
$$;

-- ═══ 11. get_duel_state — full participant snapshot (reconnects) ══════

create or replace function public.get_duel_state(p_duel_id uuid)
returns jsonb
language sql stable security definer set search_path = public as $$
  select case
    when exists (select 1 from public.duel_players
                 where duel_id = p_duel_id and player_id = auth.uid())
    then (
      select jsonb_build_object(
        'duel',     to_jsonb(d),
        'players',  (select coalesce(jsonb_agg(to_jsonb(dp) order by dp.joined_at), '[]'::jsonb)
                     from public.duel_players dp where dp.duel_id = p_duel_id),
        'my_guesses',
                    (select coalesce(jsonb_agg(jsonb_build_object(
                              'guess', g.guess, 'colors', g.colors, 'attempt_no', g.attempt_no)
                              order by g.attempt_no), '[]'::jsonb)
                     from public.guesses g
                     where g.duel_id = p_duel_id and g.player_id = auth.uid())
      )
      from public.duels d where d.id = p_duel_id
    )
    else null
  end;
$$;

-- ═══ 12. Function grants ══════════════════════════════════════════════
-- Default EXECUTE goes to PUBLIC — tighten to exactly who may call what.

revoke execute on function public.create_duel(text, text, text)                  from public, anon;
revoke execute on function public.join_duel(text, text, text)                    from public, anon;
revoke execute on function public.leave_duel(uuid)                               from public, anon;
revoke execute on function public.claim_forfeit(uuid)                            from public, anon;
revoke execute on function public.touch_duel(uuid)                               from public, anon;
revoke execute on function public.get_duel_state(uuid)                           from public, anon;

grant execute on function public.create_duel(text, text, text)                   to authenticated;
grant execute on function public.join_duel(text, text, text)                     to authenticated;
grant execute on function public.leave_duel(uuid)                                to authenticated;
grant execute on function public.claim_forfeit(uuid)                             to authenticated;
grant execute on function public.touch_duel(uuid)                                to authenticated;
grant execute on function public.get_duel_state(uuid)                            to authenticated;

-- Internal: service role / other SECURITY DEFINER functions only.
revoke execute on function public.apply_guess(uuid, uuid, text, jsonb, boolean)  from public, anon, authenticated;
revoke execute on function public.settle_duel(uuid)                              from public, anon, authenticated;
revoke execute on function public.duel_state(uuid)                               from public, anon, authenticated;

-- ═══ 13. Realtime ═════════════════════════════════════════════════════
-- duel_secrets is deliberately NOT published. RLS filters what each
-- subscriber receives (opponent guess letters never broadcast).

alter publication supabase_realtime add table public.duels;
alter publication supabase_realtime add table public.duel_players;
alter publication supabase_realtime add table public.guesses;

-- ═══ 14. Seed the kid-safe word bank (mirrors src/types.ts banks) ═════

insert into public.word_bank (word, word_length, difficulty) values
  -- easy (4 letters)
  ('GAME',4,'easy'),('WORD',4,'easy'),('FIRE',4,'easy'),('RAIN',4,'easy'),
  ('STAR',4,'easy'),('MOON',4,'easy'),('TREE',4,'easy'),('LAKE',4,'easy'),
  ('SAND',4,'easy'),('WIND',4,'easy'),('FLOW',4,'easy'),('MIND',4,'easy'),
  ('NOTE',4,'easy'),('ROCK',4,'easy'),('BIRD',4,'easy'),('FISH',4,'easy'),
  ('LEAF',4,'easy'),('SONG',4,'easy'),('LOVE',4,'easy'),('TIME',4,'easy'),
  ('BEAR',4,'easy'),('BOOK',4,'easy'),('CAKE',4,'easy'),('DUCK',4,'easy'),
  ('GOLD',4,'easy'),('HAND',4,'easy'),('JUMP',4,'easy'),('KITE',4,'easy'),
  ('LION',4,'easy'),('NEST',4,'easy'),
  -- classic (5 letters)
  ('CRAFT',5,'classic'),('CLERK',5,'classic'),('TEACH',5,'classic'),('WRITE',5,'classic'),
  ('PIXEL',5,'classic'),('SMART',5,'classic'),('CREAM',5,'classic'),('SHAPE',5,'classic'),
  ('STONE',5,'classic'),('BOARD',5,'classic'),('STAMP',5,'classic'),('FLAME',5,'classic'),
  ('LIGHT',5,'classic'),('GRAPE',5,'classic'),('CORAL',5,'classic'),('LEAFY',5,'classic'),
  ('HONEY',5,'classic'),('FRESH',5,'classic'),('MATCH',5,'classic'),('WORLD',5,'classic'),
  -- hard (6 letters)
  ('PUZZLE',6,'hard'),('FLOWER',6,'hard'),('GARDEN',6,'hard'),('CASTLE',6,'hard'),
  ('RIDDLE',6,'hard'),('SILVER',6,'hard'),('SUMMER',6,'hard'),('WINTER',6,'hard'),
  ('BOTTLE',6,'hard'),('CANDLE',6,'hard'),('DINNER',6,'hard'),('FAMILY',6,'hard'),
  ('LADDER',6,'hard'),('MARKET',6,'hard'),('POCKET',6,'hard'),('SECRET',6,'hard'),
  ('WONDER',6,'hard'),('PLANET',6,'hard'),('TICKET',6,'hard'),('BRIDGE',6,'hard')
on conflict (word) do nothing;
