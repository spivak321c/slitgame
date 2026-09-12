-- ────────────────────────────────────────────────────────────────────
-- Phase 3: Gamification Layer — streaks, daily words, quests, shop
-- ────────────────────────────────────────────────────────────────────

-- 1. Streaks table — tracks daily solve streaks per player
create table if not exists public.streaks (
  player_id  uuid primary key references auth.users(id) on delete cascade,
  current_streak    int not null default 0,
  longest_streak    int not null default 0,
  last_played_date  date,
  updated_at        timestamptz not null default now()
);

-- 2. Daily words table — one word per day per difficulty, picked deterministically
create table if not exists public.daily_words (
  date        date not null,
  difficulty text not null check (difficulty in ('easy','classic','hard')),
  word        text not null,
  primary key (date, difficulty)
);

-- 3. Quest progress table — daily quest tracking per player
create table if not exists public.quest_progress (
  player_id  uuid not null references auth.users(id) on delete cascade,
  quest_id   text not null,
  date       date not null default current_date,
  progress   int not null default 0,
  claimed    boolean not null default false,
  primary key (player_id, quest_id, date)
);

-- 4. Items catalog — shop items (stickers, mascot cosmetics, avatar items)
create table if not exists public.items (
  id        text primary key,
  name      text not null,
  emoji     text not null,
  rarity    text not null check (rarity in ('common','rare','epic','legendary')),
  price     int not null,
  type      text not null check (type in ('sticker','mascot','avatar'))
);

-- 5. Inventory — items owned by each player
create table if not exists public.inventory (
  player_id    uuid not null references auth.users(id) on delete cascade,
  item_id      text not null references public.items(id),
  acquired_at  timestamptz not null default now(),
  primary key (player_id, item_id)
);

-- ── RLS Policies ─────────────────────────────────────────────────────

alter table public.streaks enable row level security;
alter table public.daily_words enable row level security;
alter table public.quest_progress enable row level security;
alter table public.inventory enable row level security;
-- Items catalog is public (read-only for anon)
alter table public.items enable row level security;

-- Streaks: player can read/update only their own
create policy "streaks_self_read" on public.streaks
  for select using (auth.uid() = player_id);
create policy "streaks_self_upsert" on public.streaks
  for insert with check (auth.uid() = player_id);
create policy "streaks_self_update" on public.streaks
  for update using (auth.uid() = player_id);

-- Daily words: public read (the word is revealed at game time, not here)
create policy "daily_words_public_read" on public.daily_words
  for select using (true);

-- Quest progress: player can read/update only their own
create policy "quests_self_read" on public.quest_progress
  for select using (auth.uid() = player_id);
create policy "quests_self_upsert" on public.quest_progress
  for insert with check (auth.uid() = player_id);
create policy "quests_self_update" on public.quest_progress
  for update using (auth.uid() = player_id);

-- Items: public read (catalog)
create policy "items_public_read" on public.items
  for select using (true);

-- Inventory: player can read/insert only their own
create policy "inventory_self_read" on public.inventory
  for select using (auth.uid() = player_id);
create policy "inventory_self_insert" on public.inventory
  for insert with check (auth.uid() = player_id);

-- ── Seed items catalog ──────────────────────────────────────────────
-- The client also bundles this catalog in src/types.ts (offline-tolerant).
-- The server copy allows future server-side validation / sync.

insert into public.items (id, name, emoji, rarity, price, type) values
  ('sticker-star',     'Star Sticker',     '⭐', 'common',    15, 'sticker'),
  ('sticker-heart',   'Heart Sticker',    '❤️', 'common',    15, 'sticker'),
  ('sticker-smile',   'Smiley Sticker',   '😊', 'common',    20, 'sticker'),
  ('sticker-cloud',   'Cloud Sticker',    '☁️', 'common',    20, 'sticker'),
  ('sticker-fire',    'Fire Sticker',     '🔥', 'rare',      40, 'sticker'),
  ('sticker-rainbow', 'Rainbow Sticker',  '🌈', 'rare',      50, 'sticker'),
  ('sticker-bolt',    'Lightning Sticker','⚡', 'rare',      45, 'sticker'),
  ('sticker-crown',   'Crown Sticker',    '👑', 'epic',     100, 'sticker'),
  ('sticker-rocket',  'Rocket Sticker',   '🚀', 'epic',     120, 'sticker'),
  ('sticker-dragon',  'Dragon Sticker',   '🐉', 'epic',     110, 'sticker'),
  ('sticker-trophy',  'Trophy Sticker',   '🏆', 'legendary',250, 'sticker'),
  ('sticker-unicorn', 'Unicorn Sticker',  '🦄', 'legendary',300, 'sticker'),
  ('mascot-glasses',  'Cool Glasses',     '👓', 'rare',      60, 'mascot'),
  ('mascot-hat',      'Party Hat',        '🎩', 'epic',      90, 'mascot'),
  ('mascot-bow',      'Bow Tie',          '🎀', 'rare',      55, 'mascot')
on conflict (id) do nothing;

-- ── RPC: get_daily_word ─────────────────────────────────────────────
-- Returns the word for today + a given difficulty. If no row exists,
-- picks one deterministically from the word_bank and inserts it.
-- (The client also has a local fallback for offline play.)

create or replace function public.get_daily_word(p_difficulty text)
returns text
language plpgsql
security definer
as $$
declare
  v_word text;
  v_length int;
  v_today date := current_date;
begin
  -- Try to fetch today's word
  select word into v_word
  from public.daily_words
  where date = v_today and difficulty = p_difficulty;

  if v_word is not null then
    return v_word;
  end if;

  -- Determine word length from difficulty
  v_length := case p_difficulty
    when 'easy'    then 4
    when 'hard'    then 6
    else 5
  end;

  -- Pick deterministically from the word_bank using today's date as seed
  select word into v_word
  from public.word_bank
  where length(word) = v_length and is_kid_safe = true
  order by (
    -- Simple deterministic pick: hash of date + word
    hashtext(to_char(v_today, 'YYYYMMDD') || word)
  )
  limit 1;

  if v_word is null then
    -- Fallback: any word of the right length
    select word into v_word
    from public.word_bank
    where length(word) = v_length
    limit 1;
  end if;

  -- Cache for the rest of the day
  insert into public.daily_words (date, difficulty, word)
  values (v_today, p_difficulty, v_word)
  on conflict (date, difficulty) do nothing;

  return v_word;
end;
$$;

-- ── RPC: claim_quest_reward ──────────────────────────────────────────
-- Marks a quest as claimed and awards coins (idempotent).

create or replace function public.claim_quest_reward(
  p_quest_id text,
  p_reward int
)
returns void
language plpgsql
security definer
as $$
declare
  v_player uuid := auth.uid();
  v_already_claimed boolean;
begin
  if v_player is null then return; end if;

  select claimed into v_already_claimed
  from public.quest_progress
  where player_id = v_player and quest_id = p_quest_id and date = current_date;

  if v_already_claimed then return; end if; -- idempotent

  -- Mark as claimed
  update public.quest_progress
  set claimed = true
  where player_id = v_player and quest_id = p_quest_id and date = current_date;

  -- Award coins
  update public.players
  set coins = coins + p_reward
  where id = v_player;
end;
$$;
