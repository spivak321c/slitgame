# Slitgame — UI/Gameplay Change Log

Concise record of UI, animation, and game-feel improvements. One entry per approved step.

## Step 1 — Fix missing shake animation & no-scrollbar utility

- **Files changed:** `src/index.css`
- **What:** Added `@keyframes shake` (damped horizontal oscillation with a hair of rotation, ~0.4s) and `.no-scrollbar` (hides scrollbars on WebKit/Firefox/IE while keeping scroll).
- **Why:** Both were referenced in JSX (`animate-[shake_0.4s_ease-in-out]` in `PuzzleView`/`DuelView`; `no-scrollbar` on the header chip cluster in `App.tsx`) but **defined nowhere**, so they silently produced no effect. An invalid/too-short guess played the shake sound but the grid never moved, and the mobile header showed an ugly scrollbar. Pure additive CSS — no gameplay or logic change.
- **Test result:** `pnpm lint` ✓ (exit 0), `pnpm build` ✓ (exit 0). Both primitives confirmed present in the production CSS bundle.

## Step 2 — Play per-tile reveal audio in solo PuzzleView

- **Files changed:** `src/components/PuzzleView.tsx`
- **What:** In `submitGuess`, after a guess validates as a real word and is committed, compute `calculateLetterStates(guess, word)` and call `sound.playTileReveal(idx * 0.08, st)` per letter — staggered to sync with the existing flip animation (`delay: colIdx * 0.08`).
- **Why:** `sound.playTileReveal` was already implemented and called in `DuelView` (lines 115 & 181) but never in solo `PuzzleView` — the most-played screen. Tiles flipped silently. This reuses the existing audio method and `calculateLetterStates` import (already present), matches the DuelView reveal pattern exactly, and adds no new dependency. Each tile's pitch reflects its status (correct=pitched-up triangle, present=rising sine, absent=low sine).
- **Test result:** `pnpm lint` ✓ (exit 0), `pnpm build` ✓ (exit 0, 2089 modules).

## Step 3 — Letter "pop" animation on typed tiles

- **Files changed:** `src/components/PuzzleView.tsx`
- **What:** Wrapped the tile letter in an inner `motion.span` keyed by `tile.letter`. Tiles in the row actively being typed (and holding a letter) mount with `initial={{ scale: 0.3, opacity: 0 }}` and spring to full size — a springy "letterpress stamp" on each keystroke.
- **Why:** Typing previously made letters appear instantly with no feedback. The pop adds tactile, playful feel. Deliberately applied to an inner span (not the outer tile) so the outer tile's stable `key` + flip animation stay 100% untouched — remounting the outer tile with `initial={false}` could skip the existing flip, a regression risk this approach avoids. No new imports (`motion` already imported); backspace and committed rows are unaffected (span remounts to `initial={false}`).
- **Test result:** `pnpm lint` ✓ (exit 0), `pnpm build` ✓ (exit 0, 2089 modules).

## Step 4 — Win celebration + winning-row bounce on solo solve

- **Files changed:** `src/App.tsx`, `src/components/PuzzleView.tsx`
- **What (App.tsx):** `handleSolvePuzzle` now calls `triggerCelebration()` on every win — the floating PartyPopper star overlay fires on any solve, not just level-ups/achievements/coin claims.
- **What (PuzzleView.tsx):** The winning row's tiles hop in a staggered wave after their flip lands: `y: [0, -18, 0, -6, 0]`, per-tile delay `0.6 + colIdx * 0.08`, duration 0.6s, physically-correct easing (`easeOut` up, `easeIn` down, small settle).
- **Why:** A solo win that didn't level you up previously produced zero celebration — just sound and a panel. Now every solve gets confetti stars + the win arpeggio + a hop wave on the solved row. Two files because the star overlay is a global App-level effect while the hop is grid-local.
- **Safety:** Winning rows keep **identical** flip timing via per-property transitions (`rotateX`/`backgroundColor` unchanged); non-winning rows and empty rows keep the exact previous transition object. If a level-up also triggers the stars, the second call replaces the batch — no visual duplication. Duel flow untouched.
- **Test result:** `pnpm lint` ✓ (exit 0), `pnpm build` ✓ (exit 0, 2089 modules).

---

# Build Phases — per GAMIFICATION_PROPOSAL.md (source of truth)

## Phase 0 — Foundations: persistence + Supabase scaffold + SPA config

- **Files changed:** `src/App.tsx`, `package.json` / `pnpm-lock.yaml` (deps).
- **Files added:** `src/store/gameStore.ts`, `src/lib/supabase.ts`, `src/vite-env.d.ts`, `.env.example`, `vercel.json`.
- **What (persistence):** `profile`, `coinHistory`, and `achievements` moved from `App.tsx` `useState` into a Zustand store with `persist` middleware → localStorage key `slotword-save-v1`. Setters accept value-or-updater (mirroring `setState`), so all existing call sites (`setProfile(prev => ...)`) work unchanged. Ledger capped at 50 receipts to bound storage. Custom `merge` keeps the achievement catalog code-owned while only unlock state is restored — achievements shipped later will appear for returning players.
- **Why:** Refresh previously wiped all coins/XP/achievements — the #1 functional bug. Also removes a latent StrictMode fragility: `handleUnlockAchievement`'s closure flag depended on React's eager-state timing; Zustand runs updaters synchronously, so the unlock sound/celebration now fires deterministically.
- **What (Supabase scaffold):** `src/lib/supabase.ts` exports a nullable client + `isSupabaseConfigured` flag + `ensureAnonymousSession()` (anonymous auth, session persisted under `slotword-auth`, in-flight promise deduped for StrictMode double-mount). `App.tsx` handshakes once on mount into a non-persisted `useSessionStore` (`playerId`/`authReady`). With env vars unset or offline, everything resolves to local-only mode — zero behavior change.
- **Why:** Prepares Phase 1 duels (server-authoritative 1v1) without coupling solo play to the network. Anonymous UUID identity is COPPA-friendly (no email/PII).
- **What (SPA config):** `vercel.json` rewrite `/(.*)` → `/index.html` so client-side routes and future duel share links (`/duel/ABCD`) survive refresh on Vercel. `.env.example` documents `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (already covered by `.gitignore`'s `.env*` + `!.env.example`).
- **Known trade-off:** main bundle grew to ~706 kB (supabase-js). Acceptable for now; lazy-loading the duel module is scheduled in the Phase 4 perf pass.
- **Test result:** `pnpm lint` ✓, `pnpm build` ✓ (2138 modules). Headless store test: 10/10 checks (defaults, updater setters, storage write, rehydrate round-trip, ledger cap). Real-browser check (Chromium + production build): 0 console errors, claimed +25 coins → `slotword-save-v1` written → **reload → balance still 125**.

## Phase 1 — Real 1v1 Duel MVP

- **Files added:** `supabase/migrations/0001_duels.sql`, `supabase/functions/_shared/rules.ts`, `supabase/functions/submit_guess/index.ts`, `src/lib/duelTypes.ts`, `src/lib/duelService.ts`.
- **Files changed:** `src/components/DuelView.tsx` (full rewrite), `src/components/CreateDuelModal.tsx` (rewrite), `src/components/DuelResultSheet.tsx` (rewrite), `src/components/DashboardView.tsx`, `src/components/LeaderboardView.tsx`, `src/components/LandingPage.tsx`, `src/App.tsx`, `src/store/gameStore.ts`, `src/types.ts`.
- **Files removed:** `src/data/duelRooms.ts`, `src/components/RivalsStrip.tsx` (bots + mock rooms).
- **What (backend — port of `server.ts`):** Postgres schema (`duels`, `duel_players`, `guesses`) with RLS that hides `duels.secret_word` and `guesses.guess` from non-players and the opponent until reveal. Three SECURITY DEFINER RPCs — `create_duel`, `join_duel`, `submit_guess` — run server-authoritative validation: `calculateLetterStates` is ported to PL/pgSQL so the frontend can never claim a wrong-letter outcome. An Edge Function (`submit_guess/index.ts`) mirrors the exact same `calculateLetterStates` from solo `rules.ts` for Supabase Realtime broadcast (zero logic drift). `settle_duel` resolves win → fewest attempts → fastest time → draw.
- **What (frontend — real 1v1, no bots):** `duelService.ts` is the only boundary to Supabase (create/join/submit/forfeit + Realtime channel subscription). `DuelView` rewritten end-to-end: lobby (difficulty picker, no stakes) → waiting room (room code + shareable `/duel/CODE` link) → live match (your board + opponent's color-only grid + countdown timer) → result sheet (win/draw/loss + rematch). `activeDuelId` persisted to localStorage so a mid-duel refresh reconnects you. `?duel=CODE` share links auto-join on app boot.
- **Why:** Replaces the fake staked-rooms/bot-rivals economy (stakes + coin faucets) with a COPPA-friendly, ethical fun-only model: no coins at risk, rewards are server-mirrored and idempotent, no matchmaking (room codes/links only), no bots. Server-authoritative guess validation prevents client-side cheating.
- **Safety:** Solo practice + profiles untouched. With Supabase env vars unset, `duelService` short-circuits to clear offline errors — the rest of the app is unchanged. Removed `Opponent`/`DuelSession`/`OPPONENTS`/`deductCoins` (dead under the new model).
- **Test result:** `pnpm lint` ✓, `pnpm build` ✓ (2138 modules, 708 kB / 203 kB gzip).

