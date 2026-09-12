/**
 * Duel domain types shared by the service layer and UI.
 * Shapes mirror the JSON returned by the Postgres RPCs in
 * supabase/migrations/0001_duels.sql.
 */

export type LetterState = 'correct' | 'present' | 'absent';
export type DuelStatus = 'waiting' | 'active' | 'finished' | 'cancelled';
export type DuelPlayerStatus = 'playing' | 'won' | 'lost';
export type DuelDifficulty = 'easy' | 'classic' | 'hard';

export interface DuelPlayerState {
  player_id: string;
  username: string;
  avatar: string;
  status: DuelPlayerStatus;
  attempts: number;
  time_ms: number | null;
  colors: LetterState[][];
  left_at: string | null;
  last_seen: string;
  joined_at: string;
  finished_at: string | null;
}

export interface DuelRow {
  id: string;
  code: string;
  difficulty: DuelDifficulty;
  word_length: number;
  attempts_limit: number;
  status: DuelStatus;
  winner_player_id: string | null;
  is_draw: boolean;
  revealed_word: string | null;
  created_by: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface DuelGuessEntry {
  guess: string;
  colors: LetterState[];
  attempt_no: number;
}

/** Everything a client needs to render a duel, in one payload. */
export interface DuelSnapshot {
  duel: DuelRow;
  players: DuelPlayerState[];
  myGuesses: DuelGuessEntry[];
  myPlayerId: string;
}

export interface DuelRewards {
  coins: number;
  xp: number;
}

export interface DuelOutcome {
  /** Phase 2 — the settled duel's id, used for idempotent local payout. */
  duelId: string;
  won: boolean;
  draw: boolean;
  word: string;
  attempts: number;
  timeMs: number | null;
  rewards: DuelRewards;
}

/**
 * Reward table — mirrors settle_duel in the migration exactly.
 * Winner: 2× difficulty coins + difficulty XP · loser: 10/20 · draw: 10/30.
 * Applied locally for instant pouch feedback in Phase 1; Phase 2 makes the
 * server `players` row the source of truth.
 */
export function duelRewards(
  difficulty: DuelDifficulty,
  outcome: 'won' | 'lost' | 'draw'
): DuelRewards {
  const coins = difficulty === 'easy' ? 15 : difficulty === 'hard' ? 40 : 25;
  const xp = difficulty === 'easy' ? 30 : difficulty === 'hard' ? 80 : 50;
  if (outcome === 'won') return { coins: coins * 2, xp };
  if (outcome === 'draw') return { coins: 10, xp: 30 };
  return { coins: 10, xp: 20 };
}

/** Opponent heartbeat freshness window — must match claim_forfeit (25 s). */
export const OPPONENT_STALE_MS = 25_000;

export function opponentIsStale(player: DuelPlayerState | null): boolean {
  if (!player) return false;
  if (player.left_at) return true;
  return Date.now() - new Date(player.last_seen).getTime() > OPPONENT_STALE_MS;
}
