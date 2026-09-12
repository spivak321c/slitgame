/**
 * Duel service — typed client for the Supabase duel backend.
 *
 * All game actions are Postgres RPCs (SECURITY DEFINER, auth.uid()-gated)
 * except submit_guess, which is an Edge Function because it runs the
 * ported TypeScript color algorithm. Realtime sync = postgres_changes on
 * duels/duel_players/guesses → refetch one snapshot (simple + always
 * consistent). A heartbeat keeps last_seen fresh so the opponent can claim
 * a forfeit if we vanish.
 */

import { supabase, isSupabaseConfigured, ensureAnonymousSession } from './supabase';
import type { DuelDifficulty, DuelSnapshot } from './duelTypes';

export type DuelErrorCode =
  | 'offline'
  | 'not-found'
  | 'full'
  | 'already-started'
  | 'finished'
  | 'cancelled'
  | 'not-active'
  | 'not-in-duel'
  | 'already-finished'
  | 'bad-length'
  | 'not-a-word'
  | 'opponent-still-here'
  | 'unauthorized'
  | 'server-error'
  | 'unknown';

const FRIENDLY: Record<DuelErrorCode, string> = {
  offline: 'Duels need an online connection right now.',
  'not-found': "Hmm, we couldn't find that duel code.",
  full: 'That duel is already full.',
  'already-started': 'That duel already started without you.',
  finished: 'That duel is already finished.',
  cancelled: 'That duel was cancelled.',
  'not-active': 'This duel is not running anymore.',
  'not-in-duel': "You're not part of this duel.",
  'already-finished': 'You already finished your board!',
  'bad-length': 'Check the word length!',
  'not-a-word': "Hmm, that's not in our word list.",
  'opponent-still-here': 'Your opponent is still there — keep playing!',
  unauthorized: 'Please reload the page and try again.',
  'server-error': 'Something hiccuped — try again in a moment.',
  unknown: 'Something went wrong — try again.',
};

export class DuelError extends Error {
  code: DuelErrorCode;
  constructor(code: DuelErrorCode) {
    super(FRIENDLY[code]);
    this.code = code;
    this.name = 'DuelError';
  }
}

/** Raw JSON shapes returned by the RPCs. */
interface RawDuelState {
  duel: DuelSnapshot['duel'];
  players: DuelSnapshot['players'];
  my_guesses?: DuelSnapshot['myGuesses'];
}

function toSnapshot(raw: RawDuelState, myPlayerId: string): DuelSnapshot {
  return {
    duel: raw.duel,
    players: raw.players ?? [],
    myGuesses: (raw.my_guesses ?? []).map(g => ({
      guess: g.guess,
      colors: g.colors ?? [],
      attempt_no: g.attempt_no,
    })),
    myPlayerId,
  };
}

/** Throws DuelError when an RPC result carries { error: code }. */
function checkRpcError<T>(result: T | { error: string } | null): T {
  if (result && typeof result === 'object' && 'error' in result) {
    const code = (result as { error: string }).error as DuelErrorCode;
    throw new DuelError(code in FRIENDLY ? code : 'unknown');
  }
  if (result === null || result === undefined) {
    throw new DuelError('unknown');
  }
  return result as T;
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new DuelError('offline');
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    console.warn(`[duel] rpc ${fn} failed:`, error.message);
    throw new DuelError('server-error');
  }
  return checkRpcError<T>(data as T | { error: string } | null);
}

/** Ensures we have an anonymous session; returns the player id. */
async function requirePlayerId(): Promise<string> {
  const id = await ensureAnonymousSession();
  if (!id) throw new DuelError('offline');
  return id;
}

export interface CreateDuelResult {
  duelId: string;
  code: string;
}

export async function createDuel(
  difficulty: DuelDifficulty,
  username: string,
  avatar: string
): Promise<CreateDuelResult> {
  await requirePlayerId();
  const res = await rpc<{ duel_id: string; code: string; error?: string }>('create_duel', {
    p_difficulty: difficulty,
    p_username: username,
    p_avatar: avatar,
  });
  return { duelId: res.duel_id, code: res.code };
}

export async function joinDuel(
  code: string,
  username: string,
  avatar: string
): Promise<CreateDuelResult> {
  await requirePlayerId();
  const res = await rpc<{ duel_id: string; code: string; error?: string }>('join_duel', {
    p_code: code,
    p_username: username,
    p_avatar: avatar,
  });
  return { duelId: res.duel_id, code: res.code };
}

export async function leaveDuel(duelId: string): Promise<void> {
  if (!supabase) return;
  await rpc<{ ok?: boolean }>('leave_duel', { p_duel_id: duelId });
}

export async function claimForfeit(duelId: string): Promise<DuelSnapshot> {
  const playerId = await requirePlayerId();
  const raw = await rpc<RawDuelState>('claim_forfeit', { p_duel_id: duelId });
  return toSnapshot(raw, playerId);
}

export async function touchDuel(duelId: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.rpc('touch_duel', { p_duel_id: duelId });
  } catch {
    // Heartbeat is best-effort; never let it break gameplay.
  }
}

// ── Phase 2: server-authoritative profile sync ─────────────────────────
// After a duel finishes, settle_duel has already updated the player's row
// server-side (coins, xp, duels_played, duels_won). We mirror that row into
// the local profile so the server is the source of truth — the instant
// client-side award in handleDuelFinished is just for immediate feedback;
// this sync corrects any drift and prevents double-payout on refresh.

export interface ServerPlayerRow {
  coins: number;
  xp: number;
  duelsPlayed: number;
  duelsWon: number;
  username: string;
  avatar: string;
}

/**
 * Reads the authenticated player's row from Supabase (RLS-gated to own row).
 * Returns null when Supabase is unconfigured, the session is missing, or the
 * row doesn't exist yet — callers must treat null as "stay with local award".
 */
export async function fetchServerProfile(): Promise<ServerPlayerRow | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  const playerId = await ensureAnonymousSession();
  if (!playerId) return null;
  const { data, error } = await supabase
    .from('players')
    .select('coins,xp,duels_played,duels_won,username,avatar')
    .eq('id', playerId)
    .maybeSingle();
  if (error) {
    console.warn('[duel] fetchServerProfile failed:', error.message);
    return null;
  }
  if (!data) return null;
  return {
    coins: data.coins,
    xp: data.xp,
    duelsPlayed: data.duels_played,
    duelsWon: data.duels_won,
    username: data.username,
    avatar: data.avatar,
  };
}

/** Full snapshot for a duel we belong to (used on load / reconnect). */
export async function getDuelState(duelId: string): Promise<DuelSnapshot | null> {
  if (!supabase || !isSupabaseConfigured) return null;
  const playerId = await ensureAnonymousSession();
  if (!playerId) throw new DuelError('offline');
  const { data, error } = await supabase.rpc('get_duel_state', { p_duel_id: duelId });
  if (error) {
    console.warn('[duel] get_duel_state failed:', error.message);
    throw new DuelError('server-error');
  }
  if (!data) return null; // not a participant (or duel doesn't exist)
  return toSnapshot(data as RawDuelState, playerId);
}

/** Submit a guess through the Edge Function (server-authoritative colors). */
export async function submitDuelGuess(
  duelId: string,
  guess: string
): Promise<DuelSnapshot> {
  if (!supabase) throw new DuelError('offline');
  const playerId = await requirePlayerId();
  const { data, error } = await supabase.functions.invoke('submit_guess', {
    body: { duel_id: duelId, guess },
  });
  if (error) {
    console.warn('[duel] submit_guess failed:', error.message);
    throw new DuelError('server-error');
  }
  if (data && typeof data === 'object' && 'error' in data) {
    const code = (data as { error: string }).error as DuelErrorCode;
    throw new DuelError(code in FRIENDLY ? code : 'unknown');
  }
  if (!data || !('duel' in data)) throw new DuelError('unknown');
  return toSnapshot(data as RawDuelState, playerId);
}

export interface DuelSubscription {
  unsubscribe: () => void;
}

/**
 * Live sync for one duel: any change to the duel, its players, or guesses
 * triggers a single snapshot refetch (debounced). Also runs the presence
 * heartbeat every 10 s so the opponent can claim a forfeit if we vanish.
 */
export function subscribeDuel(
  duelId: string,
  onChange: (snapshot: DuelSnapshot) => void,
  onError?: (err: DuelError) => void
): DuelSubscription {
  if (!supabase) {
    onError?.(new DuelError('offline'));
    return { unsubscribe: () => undefined };
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  const refetch = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      getDuelState(duelId)
        .then(snap => {
          if (snap) onChange(snap);
        })
        .catch(err => onError?.(err));
    }, 150);
  };

  const channel = supabase
    .channel(`duel:${duelId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'duels', filter: `id=eq.${duelId}` },
      refetch
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'duel_players', filter: `duel_id=eq.${duelId}` },
      refetch
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'guesses', filter: `duel_id=eq.${duelId}` },
      refetch
    )
    .subscribe();

  const heartbeat = setInterval(() => touchDuel(duelId), 10_000);
  // One immediate beat so last_seen is fresh from the moment we watch.
  touchDuel(duelId);

  return {
    unsubscribe: () => {
      if (timer) clearTimeout(timer);
      clearInterval(heartbeat);
      if (supabase) supabase.removeChannel(channel);
    },
  };
}
