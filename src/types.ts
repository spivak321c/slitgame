export type ScreenType =
  | 'landing'
  | 'onboarding'
  | 'dashboard'
  | 'play'
  | 'duel'
  | 'leaderboard'
  | 'achievements'
  | 'profile'
  | 'shop'
  | 'collection';

// ── Difficulty & Word Length Variation ────────────────────────────────

export type Difficulty = 'easy' | 'classic' | 'hard';

export interface DifficultyConfig {
  id: Difficulty;
  label: string;
  wordLength: number;
  attempts: number;
  baseReward: number; // coins
  xpReward: number;
  description: string;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  {
    id: 'easy',
    label: 'Quick',
    wordLength: 4,
    attempts: 5,
    baseReward: 15,
    xpReward: 30,
    description: 'Four little letters. Perfect warm-up.',
  },
  {
    id: 'classic',
    label: 'Classic',
    wordLength: 5,
    attempts: 6,
    baseReward: 25,
    xpReward: 50,
    description: 'The signature five-letter test.',
  },
  {
    id: 'hard',
    label: 'Grand',
    wordLength: 6,
    attempts: 7,
    baseReward: 40,
    xpReward: 80,
    description: 'Six letters. For word wizards only.',
  },
];

export function difficultyForLength(length: number): DifficultyConfig {
  return DIFFICULTIES.find(d => d.wordLength === length) ?? DIFFICULTIES[1];
}

// ── Player Economy: Coins, XP & Levels ────────────────────────────────

export interface PlayerProfile {
  coins: number;
  xp: number;
  username: string;
  avatar: string;
  gamesPlayed: number;
  gamesWon: number;
  duelsPlayed: number;
  duelsWon: number;
  bestAttempts: Record<Difficulty, number | null>;
  /** Phase 2 — flips to true once the 3-step onboarding completes. */
  hasOnboarded: boolean;
}

// Level curve: each level costs 100 more XP than the last.
// XP needed to reach level N: 100 * (N-1) * N / 2
export function levelFromXp(xp: number): { level: number; intoLevel: number; neededForLevel: number } {
  let level = 1;
  while (xp >= 100 * level) {
    xp -= 100 * level;
    level += 1;
  }
  return { level, intoLevel: xp, neededForLevel: 100 * level };
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Fresh Solver',
  2: 'Letter Learner',
  3: 'Word Explorer',
  4: 'Pattern Finder',
  5: 'Wordsmith',
  6: 'Word Wizard',
  7: 'Grand Lexicon',
  8: 'Word Master',
};

export function levelTitle(level: number): string {
  return LEVEL_TITLES[level] ?? 'Word Legend';
}

// ── Game State ────────────────────────────────────────────────────────

export interface GuessRow {
  letters: string[];
  submitted: boolean;
}

export interface GameState {
  word: string;
  guesses: string[];
  currentGuess: string;
  status: 'playing' | 'won' | 'lost';
  difficulty: Difficulty;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  metric?: string;
  iconType: 'tile' | 'bolt' | 'shield' | 'coins' | 'star';
}

// ── Phase 3: Gamification Types ──────────────────────────────────────

export interface StreakInfo {
  current: number;
  longest: number;
  /** YYYY-MM-DD of the last day a puzzle was solved. */
  lastPlayedDate: string | null;
}

export type StickerRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  rarity: StickerRarity;
  price: number;
  type: 'sticker' | 'mascot' | 'avatar';
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  goal: number;
  progress: number;
  reward: number;
  icon: string;
  claimed: boolean;
}

export type MascotMood =
  | 'idle'
  | 'happy'
  | 'excited'
  | 'celebrate'
  | 'encourage'
  | 'think';

/** Returns YYYY-MM-DD in local time (not UTC) for streak tracking. */
export function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Returns the number of days between two YYYY-MM-DD strings (b - a). */
export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00');
  const db = new Date(b + 'T00:00:00');
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

// ── Daily Quest Definitions ───────────────────────────────────────────

export const DAILY_QUESTS: Omit<Quest, 'progress' | 'claimed'>[] = [
  { id: 'solve-2', title: 'Word Solver', description: 'Solve 2 puzzles today', goal: 2, reward: 30, icon: 'gamepad' },
  { id: 'win-duel', title: 'Duel Hero', description: 'Win 1 duel today', goal: 1, reward: 50, icon: 'swords' },
  { id: 'use-vowels', title: 'Vowel Power', description: 'Use 15 vowels in guesses', goal: 15, reward: 25, icon: 'letters' },
];

// ── Shop Catalog (fun-only, no real money) ────────────────────────────

export const SHOP_CATALOG: ShopItem[] = [
  // Common stickers
  { id: 'sticker-star', name: 'Star Sticker', emoji: '⭐', rarity: 'common', price: 15, type: 'sticker' },
  { id: 'sticker-heart', name: 'Heart Sticker', emoji: '❤️', rarity: 'common', price: 15, type: 'sticker' },
  { id: 'sticker-smile', name: 'Smiley Sticker', emoji: '😊', rarity: 'common', price: 20, type: 'sticker' },
  { id: 'sticker-cloud', name: 'Cloud Sticker', emoji: '☁️', rarity: 'common', price: 20, type: 'sticker' },
  // Rare
  { id: 'sticker-fire', name: 'Fire Sticker', emoji: '🔥', rarity: 'rare', price: 40, type: 'sticker' },
  { id: 'sticker-rainbow', name: 'Rainbow Sticker', emoji: '🌈', rarity: 'rare', price: 50, type: 'sticker' },
  { id: 'sticker-bolt', name: 'Lightning Sticker', emoji: '⚡', rarity: 'rare', price: 45, type: 'sticker' },
  // Epic
  { id: 'sticker-crown', name: 'Crown Sticker', emoji: '👑', rarity: 'epic', price: 100, type: 'sticker' },
  { id: 'sticker-rocket', name: 'Rocket Sticker', emoji: '🚀', rarity: 'epic', price: 120, type: 'sticker' },
  { id: 'sticker-dragon', name: 'Dragon Sticker', emoji: '🐉', rarity: 'epic', price: 110, type: 'sticker' },
  // Legendary
  { id: 'sticker-trophy', name: 'Trophy Sticker', emoji: '🏆', rarity: 'legendary', price: 250, type: 'sticker' },
  { id: 'sticker-unicorn', name: 'Unicorn Sticker', emoji: '🦄', rarity: 'legendary', price: 300, type: 'sticker' },
  // Mascot cosmetics
  { id: 'mascot-glasses', name: 'Cool Glasses', emoji: '👓', rarity: 'rare', price: 60, type: 'mascot' },
  { id: 'mascot-hat', name: 'Party Hat', emoji: '🎩', rarity: 'epic', price: 90, type: 'mascot' },
  { id: 'mascot-bow', name: 'Bow Tie', emoji: '🎀', rarity: 'rare', price: 55, type: 'mascot' },
];

export const RARITY_STYLES: Record<
  StickerRarity,
  { label: string; color: string; bg: string; border: string; glow: string }
> = {
  common: { label: 'Common', color: 'text-[#6F625B]', bg: 'bg-[#FAF4EA]', border: 'border-[#EADFCB]', glow: '' },
  rare: { label: 'Rare', color: 'text-[#388FBF]', bg: 'bg-[#E7F5FC]', border: 'border-[#D0ECFA]', glow: '' },
  epic: { label: 'Epic', color: 'text-[#7155B5]', bg: 'bg-[#F0ECFA]', border: 'border-[#E0D8F5]', glow: 'shadow-[0_0_12px_rgba(139,114,201,0.25)]' },
  legendary: { label: 'Legendary', color: 'text-[#D4960F]', bg: 'bg-[#FFF3D6]', border: 'border-[#F2C974]', glow: 'shadow-[0_0_16px_rgba(242,184,75,0.35)]' },
};

/** Mystery box disclosed odds (kids' ethics — no blind boxes without disclosed rarity). */
export const MYSTERY_BOX_ODDS: { rarity: StickerRarity; chance: number }[] = [
  { rarity: 'common', chance: 0.60 },
  { rarity: 'rare', chance: 0.25 },
  { rarity: 'epic', chance: 0.12 },
  { rarity: 'legendary', chance: 0.03 },
];

export const MYSTERY_BOX_PRICE = 50;

// ── Word Banks by Length ──────────────────────────────────────────────

export const WORDS_BANK_4: string[] = [
  'GAME', 'WORD', 'FIRE', 'RAIN', 'STAR', 'MOON', 'TREE', 'LAKE', 'SAND', 'WIND',
  'FLOW', 'MIND', 'NOTE', 'ROCK', 'BIRD', 'FISH', 'LEAF', 'SONG', 'LOVE', 'TIME',
  'BEAR', 'BOOK', 'CAKE', 'DUCK', 'GOLD', 'HAND', 'JUMP', 'KITE', 'LION', 'NEST',
];

export const WORDS_BANK_5: string[] = [
  'CRAFT', 'CLERK', 'TEACH', 'WRITE', 'PIXEL',
  'SMART', 'CREAM', 'SHAPE', 'STONE', 'BOARD',
  'STAMP', 'FLAME', 'LIGHT', 'GRAPE', 'CORAL',
  'LEAFY', 'HONEY', 'FRESH', 'MATCH', 'WORLD',
];

export const WORDS_BANK_6: string[] = [
  'PUZZLE', 'FLOWER', 'GARDEN', 'CASTLE', 'RIDDLE',
  'SILVER', 'SUMMER', 'WINTER', 'BOTTLE', 'CANDLE',
  'DINNER', 'FAMILY', 'LADDER', 'MARKET', 'POCKET',
  'SECRET', 'WONDER', 'PLANET', 'TICKET', 'BRIDGE',
];

export function wordsForLength(length: number): string[] {
  if (length === 4) return WORDS_BANK_4;
  if (length === 6) return WORDS_BANK_6;
  return WORDS_BANK_5;
}

export function randomWord(length: number): string {
  const bank = wordsForLength(length);
  return bank[Math.floor(Math.random() * bank.length)];
}

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-win',
    title: 'First Word Smash',
    description: 'Solve your very first puzzle of any difficulty.',
    unlocked: false,
    iconType: 'tile',
  },
  {
    id: 'solve-3',
    title: 'Speed Solver',
    description: 'Solve any puzzle within 3 attempts.',
    unlocked: false,
    iconType: 'bolt',
  },
  {
    id: 'duel-win',
    title: 'Duel Champion',
    description: 'Win your first match duel against a rival.',
    unlocked: false,
    iconType: 'shield',
  },
  {
    id: 'coins-500',
    title: 'Coin Collector',
    description: 'Stack up 500 coins in your pouch.',
    unlocked: false,
    iconType: 'coins',
  },
  {
    id: 'level-5',
    title: 'Rising Star',
    description: 'Reach Level 5 and earn the Wordsmith title.',
    unlocked: false,
    iconType: 'star',
  },
];

export function calculateLetterStates(guess: string, answer: string): ('correct' | 'present' | 'absent')[] {
  const length = answer.length;
  const states: ('correct' | 'present' | 'absent')[] = Array(length).fill('absent');
  const answerLetterCount: Record<string, number> = {};

  for (let i = 0; i < length; i++) {
    const char = answer[i];
    if (guess[i] === char) {
      states[i] = 'correct';
    } else {
      answerLetterCount[char] = (answerLetterCount[char] || 0) + 1;
    }
  }

  for (let i = 0; i < length; i++) {
    if (states[i] !== 'correct') {
      const char = guess[i];
      if (answerLetterCount[char] && answerLetterCount[char] > 0) {
        states[i] = 'present';
        answerLetterCount[char]--;
      }
    }
  }

  return states;
}
