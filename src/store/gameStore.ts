import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  type PlayerProfile,
  type Achievement,
  INITIAL_ACHIEVEMENTS,
} from '../types';

/**
 * Central game store (Phase 0).
 *
 * Fixes the #1 functional bug: profile / coins / achievements previously lived
 * in App.tsx `useState`, so a refresh wiped all progress. They now live here
 * and are persisted to localStorage under `slotword-save-v1`.
 *
 * Setters accept either a value or an updater function, mirroring React's
 * `setState`, so existing call sites (`setProfile(prev => ...)`) work as-is.
 */

export const STARTING_COINS = 100;

export const DEFAULT_PROFILE: PlayerProfile = {
  coins: STARTING_COINS,
  xp: 0,
  username: 'paperpilot',
  avatar: '🥇',
  gamesPlayed: 0,
  gamesWon: 0,
  duelsPlayed: 0,
  duelsWon: 0,
  bestAttempts: { easy: null, classic: null, hard: null },
};

export interface CoinLogEntry {
  desc: string;
  amount: string;
  type: 'plus' | 'minus';
  time: string;
}

// Keep the ledger (and localStorage footprint) bounded — the pouch drawer
// only ever shows a screenful of receipts.
const MAX_COIN_LOG = 50;

type Updater<T> = T | ((prev: T) => T);
const resolve = <T,>(updater: Updater<T>, prev: T): T =>
  typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater;

interface GameStoreState {
  profile: PlayerProfile;
  coinHistory: CoinLogEntry[];
  achievements: Achievement[];
  /** Duel currently being played / awaited — survives refresh (Phase 1). */
  activeDuelId: string | null;
  setProfile: (updater: Updater<PlayerProfile>) => void;
  setCoinHistory: (updater: Updater<CoinLogEntry[]>) => void;
  setAchievements: (updater: Updater<Achievement[]>) => void;
  setActiveDuel: (duelId: string | null) => void;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      coinHistory: [],
      achievements: INITIAL_ACHIEVEMENTS,
      activeDuelId: null,
      setProfile: (updater) =>
        set((s) => ({ profile: resolve(updater, s.profile) })),
      setCoinHistory: (updater) =>
        set((s) => ({
          coinHistory: resolve(updater, s.coinHistory).slice(0, MAX_COIN_LOG),
        })),
      setAchievements: (updater) =>
        set((s) => ({ achievements: resolve(updater, s.achievements) })),
      setActiveDuel: (duelId) => set({ activeDuelId: duelId }),
    }),
    {
      name: 'slotword-save-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the durable save game is persisted; actions never are.
      partialize: (s) => ({
        profile: s.profile,
        coinHistory: s.coinHistory,
        achievements: s.achievements,
        activeDuelId: s.activeDuelId,
      }),
      // Achievement catalog always comes from code (so newly shipped
      // achievements appear for returning players); only unlock state is
      // carried over from storage.
      merge: (persisted, current) => {
        const saved = (persisted as Partial<GameStoreState> | undefined) ?? {};
        const savedAchievements = saved.achievements ?? [];
        return {
          ...current,
          ...saved,
          achievements: current.achievements.map((a) => {
            const match = savedAchievements.find((s) => s.id === a.id);
            return match
              ? { ...a, unlocked: match.unlocked, unlockedAt: match.unlockedAt }
              : a;
          }),
        };
      },
    },
  ),
);

/**
 * Ephemeral session state — deliberately NOT persisted here. The Supabase
 * session itself is persisted by supabase-js; on reload we simply re-handshake
 * via `ensureAnonymousSession()`. `playerId: null` means "offline/local-only".
 */
interface SessionStoreState {
  playerId: string | null;
  authReady: boolean;
  setSession: (playerId: string | null) => void;
}

export const useSessionStore = create<SessionStoreState>()((set) => ({
  playerId: null,
  authReady: false,
  setSession: (playerId) => set({ playerId, authReady: true }),
}));
