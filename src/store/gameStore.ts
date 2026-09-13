import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { RecentOpponent } from '../lib/duelTypes';
import {
  type PlayerProfile,
  type Achievement,
  type StreakInfo,
  type Quest,
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
  avatar: '🦊',
  gamesPlayed: 0,
  gamesWon: 0,
  duelsPlayed: 0,
  duelsWon: 0,
  bestAttempts: { easy: null, classic: null, hard: null },
  hasOnboarded: false,
};

export const DEFAULT_STREAK: StreakInfo = {
  current: 0,
  longest: 0,
  lastPlayedDate: null,
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
  /** Phase 2 — ids of duels whose payout has been applied locally, so a
   *  refresh on the result screen can't re-award (idempotency). */
  settledDuelIds: string[];
  // Phase 3 — gamification state
  streak: StreakInfo;
  dailyChestLastOpened: string | null;
  quests: Quest[];
  questsDate: string | null;
  ownedStickers: string[];
  equippedMascotItem: string | null;
  dyslexiaFont: boolean;
  // Phase 4 — cached rivals for the dashboard "Recent Rivals" strip.
  // The server is the source of truth; this is a best-effort offline
  // mirror refreshed whenever the duel screen / dashboard loads.
  recentOpponents: RecentOpponent[];
  setProfile: (updater: Updater<PlayerProfile>) => void;
  setCoinHistory: (updater: Updater<CoinLogEntry[]>) => void;
  setAchievements: (updater: Updater<Achievement[]>) => void;
  setActiveDuel: (duelId: string | null) => void;
  markDuelSettled: (duelId: string) => void;
  resetSettledDuels: () => void;
  setStreak: (updater: Updater<StreakInfo>) => void;
  setDailyChestOpened: (date: string) => void;
  setQuests: (updater: Updater<Quest[]>) => void;
  setQuestsDate: (date: string) => void;
  addOwnedSticker: (id: string) => void;
  setEquippedMascotItem: (id: string | null) => void;
  toggleDyslexiaFont: () => void;
  setRecentOpponents: (opponents: RecentOpponent[]) => void;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set) => ({
      profile: DEFAULT_PROFILE,
      coinHistory: [],
      achievements: INITIAL_ACHIEVEMENTS,
      activeDuelId: null,
      settledDuelIds: [],
      streak: DEFAULT_STREAK,
      dailyChestLastOpened: null,
      quests: [],
      questsDate: null,
      ownedStickers: [],
      equippedMascotItem: null,
      dyslexiaFont: false,
      recentOpponents: [],
      setProfile: (updater) =>
        set((s) => ({ profile: resolve(updater, s.profile) })),
      setCoinHistory: (updater) =>
        set((s) => ({
          coinHistory: resolve(updater, s.coinHistory).slice(0, MAX_COIN_LOG),
        })),
      setAchievements: (updater) =>
        set((s) => ({ achievements: resolve(updater, s.achievements) })),
      setActiveDuel: (duelId) => set({ activeDuelId: duelId }),
      markDuelSettled: (duelId) =>
        set((s) =>
          s.settledDuelIds.includes(duelId)
            ? s
            : { settledDuelIds: [...s.settledDuelIds, duelId].slice(-MAX_COIN_LOG) }
        ),
      resetSettledDuels: () => set({ settledDuelIds: [] }),
      setStreak: (updater) =>
        set((s) => ({ streak: resolve(updater, s.streak) })),
      setDailyChestOpened: (date) => set({ dailyChestLastOpened: date }),
      setQuests: (updater) =>
        set((s) => ({ quests: resolve(updater, s.quests) })),
      setQuestsDate: (date) => set({ questsDate: date }),
      addOwnedSticker: (id) =>
        set((s) =>
          s.ownedStickers.includes(id)
            ? s
            : { ownedStickers: [...s.ownedStickers, id] }
        ),
      setEquippedMascotItem: (id) => set({ equippedMascotItem: id }),
      toggleDyslexiaFont: () =>
        set((s) => ({ dyslexiaFont: !s.dyslexiaFont })),
      setRecentOpponents: (opponents) =>
        set({ recentOpponents: opponents.slice(0, 12) }),
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
        settledDuelIds: s.settledDuelIds,
        streak: s.streak,
        dailyChestLastOpened: s.dailyChestLastOpened,
        quests: s.quests,
        questsDate: s.questsDate,
        ownedStickers: s.ownedStickers,
        equippedMascotItem: s.equippedMascotItem,
        dyslexiaFont: s.dyslexiaFont,
        recentOpponents: s.recentOpponents,
      }),
      // Achievement catalog always comes from code (so newly shipped
      // achievements appear for returning players); only unlock state is
      // carried over from storage.
      merge: (persisted, current) => {
        const saved = (persisted as Partial<GameStoreState> | undefined) ?? {};
        const savedAchievements = saved.achievements ?? [];
        const savedProfile = saved.profile;
        return {
          ...current,
          ...saved,
          // Ensure forward-compat: returning saves pre-dating Phase 2 get
          // hasOnboarded inferred from existing progress so they're not
          // forced back through onboarding.
          profile: savedProfile
            ? {
                ...DEFAULT_PROFILE,
                ...savedProfile,
                hasOnboarded:
                  savedProfile.hasOnboarded ??
                  (savedProfile.gamesPlayed > 0 ||
                    savedProfile.duelsPlayed > 0),
              }
            : current.profile,
          // Phase 3 forward-compat: fill defaults for new fields if the
          // saved state predates the gamification layer.
          streak: saved.streak ?? current.streak,
          dailyChestLastOpened: saved.dailyChestLastOpened ?? null,
          quests: saved.quests ?? [],
          questsDate: saved.questsDate ?? null,
          ownedStickers: saved.ownedStickers ?? [],
          equippedMascotItem: saved.equippedMascotItem ?? null,
          dyslexiaFont: saved.dyslexiaFont ?? false,
          recentOpponents: saved.recentOpponents ?? [],
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
