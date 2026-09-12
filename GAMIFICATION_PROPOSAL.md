# Slotword — Working-Game Proposal (v2)
## Real-time 1v1 word duels for kids · free-tier architecture · full UI/UX revamp

> **Audience:** mostly kids (≈6–12). **Game:** Slotword, a cozy paper-craft word-guessing duel.
> **Scope (per latest direction):** NOT a many-player game. The only competitive mode is **1v1 duels between two real players**. **No bots.** Goal = a genuinely **working** game.
> **Hosting:** **not** restricted to Vercel — use any provider that is **as free as Vercel** (real ongoing free tier, not a trial).
> **Method:** keep the good bones (paper-craft look, coin/XP economy, sticker-book achievements, synth audio, and the *existing 1v1 duel logic* in `server.ts`) and ship in small, individually-deployable phases with approval gates.

---

## 1. What changed from the first draft

| Before (Vercel-locked) | Now (your direction) |
|---|---|
| Vercel-only backend → no WebSockets → recommended bots + async duels | Real-time **1v1** is required → we pick a backend that **can** do realtime for free |
| Bots + ghost/async opponents | **Two real players, no bots** |
| Vercel serverless + Neon/Upstash | **Vercel (frontend) + Supabase (backend)** — see §3 |

The key consequence: real-time 1v1 needs a backend that supports live connections and shared state. Vercel's serverless model can't. So the backend moves to a free provider that can — **Supabase** — while the frontend **stays on Vercel** (also free). Total: **$0** on free tiers.

---

## 2. The core reversal, plainly

A real 1v1 duel means two live players exchanging moves instantly. That needs:
1. a **live channel** between them (WebSocket-style), and
2. a **server that owns the secret word** and validates guesses (so nobody cheats), and
3. **shared, durable state** (the duel, both players' grids, the result).

Vercel gives us none of these for realtime. Supabase gives us all three on a free tier — **plus** auth and a database in the same platform, so we don't stitch three services together.

**Crucially:** the existing `server.ts` already implements the 1v1 rules we want (create-room-with-code, join-by-code, server-authoritative `calculateLetterStates`, attempts/time tiebreak, forfeit-on-disconnect). We're **porting that proven logic** onto Supabase, not inventing it from scratch.

---

## 3. Provider decision

### Recommended: **Supabase** (backend) + **Vercel** (frontend)
One free platform covers the entire backend:
- **Anonymous Auth** → each kid gets a stable UUID with **zero personal data** (COPPA-friendly). No email, no password.
- **Postgres** → source of truth (players, duels, guesses, results, streaks). Row-Level-Security hides the **secret word** from clients.
- **Realtime** → `postgres_changes` + **Presence** push live updates to both players and detect disconnects.
- **Edge Functions (Deno, TypeScript)** → server-authoritative actions: create/join duel, `submit_guess`, settle & award.
- **pg_cron / scheduled functions** → daily word (later phase).

### Alternatives considered (and why not first choice)
| Provider | Verdict |
|---|---|
| **Cloudflare Workers + Durable Objects / PartyKit** | Technically the *best* fit for realtime game rooms (an authoritative per-room server at the edge) and a generous free tier. But Durable Objects' free availability/limits are murkier and it's more engineering. **Best "upgrade later" path.** |
| **Firebase** | Anonymous auth + Realtime DB work, but the free Realtime DB caps at ~100 concurrent connections and NoSQL makes leaderboards/inventory clunky; Cloud Functions now effectively need the pay-as-you-go plan. |
| **Pusher / Ably** | Easy pub/sub, but free concurrent-connection caps are low (~50–100) and you still need a separate authoritative backend + database. |
| **Fly.io / Render (run existing `server.ts`)** | Reuses code, but Render's free tier spins down (breaks WebSockets) and Fly/Railway are now credit-based — not reliably "as free as Vercel" ongoing, plus self-managed ops. |

**Free-tier honesty (Supabase):** 500 MB Postgres, ~50k monthly active users, Realtime included (~200 concurrent connections), 500k Edge-Function invocations/month. Free projects **pause after ~1 week of inactivity** (they wake on the next request) — fine for dev/early launch; a paid tier or keep-alive removes that later.

---

## 4. The duel model (1v1, no bots)

**How two players meet — challenge by code/link (recommended, kid-safe):**
1. Player A taps **Create Duel** → picks difficulty → backend picks a **secret word server-side** and returns a **6-character code** (and a shareable link `?duel=ABC123`).
2. A sends the code/link to a friend. B opens it → **Join Duel** → match starts.
3. Both solve the **same** word simultaneously on their own boards.
4. Each sees their **own** board plus the opponent's **color grid only** (never their letters) update **live**, with a timer.
5. First to solve wins; if both solve, **fewest attempts**, then **fastest time**; both fail = draw. **Disconnect/forfeit = the other player wins.**
6. Rewards: winner gets coins + XP; loser gets a small consolation (kids' rule: everyone gets *something*). All awarded **server-side, idempotently**.

No public lobby of strangers, no random matchmaking, no bots — private, safe, simple. (We can add optional matchmaking later if you want it.)

---

## 5. Architecture

```
   🧒 Player A            🧒 Player B
   (SPA on device)        (SPA on device)
        │ load app              │ load app
        └──────────►  VERCEL (free)  ◄──────────┘
                     Static SPA — React 19 + Vite (dist/)
        │                       │                       │
        │ anonymous auth + live subscribe (wss)         │
        └───────────►  SUPABASE (free tier)  ◄──────────┘
                     ┌───────────────────────────────────┐
                     │ Anonymous Auth  → UUID, no PII    │
                     │ Edge Functions  → create/join duel│
                     │   submit_guess (validate vs       │
                     │   secret) · settle & award        │
                     │ Postgres + RLS  → players · duels │
                     │   guesses · secret_word (HIDDEN)  │
                     │ Realtime        → postgres_changes│
                     │   + presence → both players live  │
                     └───────────────────────────────────┘

   ⚠ 1v1 by room code/link · no bots · the secret word never leaves the server.
   🔒 Anonymous identity (UUID + fun username) — no email, no PII.  💸 $0 on free tiers.
```

### Data model (Supabase Postgres)
- `players(id uuid → auth.users, username, avatar, coins, xp, created_at, last_seen)`
- `duels(id uuid pk, code text unique, difficulty, word_length, attempts_limit, secret_word text (RLS-hidden), status waiting|active|finished, winner uuid|draw|null, created_by uuid, created_at, started_at, finished_at)`
- `duel_players(duel_id fk, player_id fk, status playing|won|lost, attempts int, time_ms int, joined_at, finished_at, pk(duel_id, player_id))`
- `guesses(id, duel_id fk, player_id fk, guess text, colors jsonb, created_at)`
- (later: `streaks`, `daily_words`, `quests`, `items`, `inventory` for the gamification layer)

### Realtime + authority flow
1. Client subscribes: `supabase.channel('duel:'+id)` listening to `postgres_changes` on `duels` + `guesses` (filtered to this duel) and **Presence** for online/offline.
2. A player submits a guess → **`submit_guess` Edge Function** (service role): checks length + that it's a real word, computes colors vs the **server-held secret**, writes the `guesses` row, updates `duel_players`/`duels`, detects win/lose, and when both are done **settles + awards idempotently**.
3. Postgres changes **broadcast to both subscribers** → both boards update live.
4. Presence `leave`/timeout on an **active** match → the other player wins by forfeit (reuses `server.ts` settle logic).

### Security / integrity
- **RLS:** the anon role can only read the public state of duels it belongs to; `secret_word` is **never** exposed to clients — only Edge Functions read it.
- Word validation server-side (correct length + in the curated kid-safe word bank).
- **Idempotency keys** on result/award; basic rate limiting on functions.

---

## 6. Frontend changes (stays on Vercel)
- **Add** `@supabase/supabase-js` + env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- **Auth:** on app start, `supabase.auth.signInAnonymously()` → stable player id; persist the session.
- **State:** **Zustand + `persist` (localStorage)** — fixes today's *progress-lost-on-refresh* bug and holds profile + current duel + realtime handles.
- **New Duel screens:**
  - **Duel Lobby** — "Your Duels" (waiting/active/finished) + big **Create Duel** + **Join with Code**.
  - **Duel Room** — waiting (share code) → live match (your board + opponent color-grid + timer + attempts) → result sheet (winner, rewards, **Rematch**).
  - **Rematch** flow.
- **Remove/replace:** `DuelView.tsx` bot logic, `data/duelRooms.ts` (mock), rework `CreateDuelModal` to create via the backend, rework/remove `RivalsStrip` (real recent opponents later).
- **Keep:** solo `PuzzleView` for practice; the Step 1–4 game-feel fixes (shake, reveal audio, pop, celebration).
- **Gamification hooks:** coins/XP now flow from **real** duel + solo results into the profile (levels, sticker book).

## 7. Backend changes (new, on Supabase)
- `supabase init`; write **migrations** (tables above) + **RLS policies**; `supabase db push`.
- **Edge Functions (Deno, TS):** `create_duel`, `join_duel`, `submit_guess`, `settle_duel`, `get_state`, `leave_duel`. **Port `calculateLetterStates` and the settle/tiebreak/forfeit logic straight from `server.ts`.**
- **Realtime:** enable `postgres_changes` on `duels`/`guesses`; Presence on the duel channel.
- **Seed:** curated **kid-safe** word bank (table or bundled list the function reads).
- **Local dev:** `supabase start` (local stack) + `vite dev`.
- **Retire `server.ts`/Elysia** once the port is proven (keep the file for reference during Phase 1, then remove the dead server + deps).

## 8. UI/UX + gamification (still the fun revamp — now with real stakes)
The kid-focused vision stands; it just runs on real duels now:
- **Keep & amplify the paper-craft identity** (stickers, washi tape, chunky borders, tactile shadows, Baloo 2). No generic gradients.
- **Juicy components:** `JuicyButton`, `ProgressBar`, `CoinFly`, `StarBurst`, `MascotBubble`, `ChestCard`, `QuestCard`, `Toast`. Spring presets, squash-and-stretch, confetti, number pop-ups. Respect `prefers-reduced-motion`. ≥48px touch targets, icon-first labels, dyslexia-friendly font option, positive-only messaging.
- **Reward choreography:** solve/win → tiles dance → mascot cheers → confetti → coins fly into the pouch (counter ticks up) → XP bar fills → level-up burst → streak/chest.
- **Mascot 🦊 "Slit":** greets, reacts to every guess, celebrates wins, evolves with level, wears cosmetics. Highest-ROI personality feature.
- **Progression:** daily word + streak 🔥 + daily chest + quests + adventure map + collection (stickers/pets/cosmetics with rarity) + shop/mystery box (fun-only coins).
- **Ethics (kids):** fun-only currency, no real-money purchases, no pay-to-win/solve, generous free earn, disclosed box rarity, no FOMO countdowns on children.
- **Onboarding:** 3 steps — meet the mascot → interactive how-to-play → pick avatar + fun name.

## 9. Phased plan (incremental, approval-gated)
| Phase | Scope | Type | Size |
|---|---|---|---|
| **0 — Foundations** | Zustand + `persist` (**fix refresh-loss**), Supabase project + env + **anonymous auth**, Vercel SPA config. | Full-stack setup | S |
| **1 — Real 1v1 Duel MVP** ★ | Data model + RLS, Edge Functions (create/join/submit/settle — ported from `server.ts`), Realtime sync, new Duel screens (lobby/create/join/room/result), **remove bots + mock rooms**. **This is "a working game."** | Full-stack | M–L |
| **2 — Profiles + Solo + Onboarding** | Coins/XP from real results, kid-safe word curation, how-to-play/onboarding. | Full-stack | M |
| **3 — Gamification layer** | Daily word + streaks + chest + quests + shop/collection + mascot + reward choreography + UI polish. | Full-stack | M–L |
| **4 — Social & ship-hardening** | Rematch, recent opponents, share links, PWA/offline, accessibility, performance. | Full-stack | M |
| **(later) Optional** | Matchmaking queue, or move realtime to Cloudflare Durable Objects if scale demands it. | Backend | L |

## 10. Risks & mitigations
- **Free-tier Realtime cap (~200 concurrent)** → plenty for MVP (~100 live duels); upgrade or move to Durable Objects if we outgrow it.
- **Free project auto-pause (~1 wk idle)** → wakes on request; fine early, keep-alive/paid later.
- **Cheating** → secret word server-side, RLS, server-authoritative validation, idempotency, rate limits.
- **Kids' privacy** → anonymous auth, no PII, private code/link duels (no stranger matchmaking).
- **Scope creep** → phased, individually-shippable, approval gates.
- **Content safety** → curated kid-safe word bank.
- **Live-UX edge cases** (double-join, both disconnect, clock skew) → presence + grace timer + server clock authority.

## 11. Decisions I need from you
1. **Backend provider:** **Supabase** (recommended) vs Cloudflare Durable Objects vs Firebase vs stay-Vercel+managed-realtime.
2. **How players pair:** **room code/link** (recommended, kid-safe) vs open matchmaking queue.
3. **Solo mode:** keep solo practice alongside duels (recommended) vs **duels-only**.
4. **Build order:** real 1v1 duel MVP first (recommended) vs gamification polish first.
5. **Confirm free-only:** OK to stay on Vercel-free + Supabase-free ($0), accepting the Realtime cap and idle-pause until growth justifies paid?
