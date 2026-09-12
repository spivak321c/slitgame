export type ScreenType =
  | 'landing'
  | 'dashboard'
  | 'play'
  | 'duel'
  | 'leaderboard'
  | 'achievements'
  | 'profile';

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
