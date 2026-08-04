export type ScreenType =
  | 'landing'
  | 'dashboard'
  | 'daily'
  | 'practice'
  | 'duel'
  | 'verify'
  | 'leaderboard'
  | 'achievements';

export interface WalletState {
  connected: boolean;
  address: string;
  balance: number; // in SOL
}

export interface GuessRow {
  letters: string[];
  submitted: boolean;
}

export interface GameState {
  word: string;
  guesses: string[];
  currentGuess: string;
  status: 'playing' | 'won' | 'lost';
  isDaily: boolean;
  streakIncremented: boolean;
}

export interface Opponent {
  id: string;
  name: string;
  level: string;
  avatar: string;
  accuracy: number; // 0-1
  speedSeconds: number;
}

export interface DuelSession {
  id: string;
  opponent: Opponent;
  entryFee: number; // in SOL
  prizePool: number; // in SOL
  playerGuesses: string[];
  opponentGuesses: string[];
  playerCurrentGuess: string;
  opponentCurrentGuess: string;
  playerStatus: 'playing' | 'won' | 'lost';
  opponentStatus: 'playing' | 'won' | 'lost';
  playerTimeLeft: number;
  opponentTimeLeft: number;
  word: string;
  step: 'setup' | 'commit' | 'reveal' | 'finished';
  playerCommitted: boolean;
  opponentCommitted: boolean;
  playerRevealed: boolean;
  opponentRevealed: boolean;
  playerSeed: string;
  playerHash: string;
  opponentSeed: string;
  opponentHash: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  metric?: string;
  iconType: 'streak-chain' | 'triple-tile' | 'envelope' | 'magnifier';
}

export interface VerifiedDay {
  date: string;
  word: string;
  seed: string;
  hash: string; // SHA-256
  txSignature: string;
  blockTime: string;
}

// Word list with positive, simple learning associations
export const WORDS_BANK = [
  'CRAFT', 'CLERK', 'TEACH', 'WRITE', 'PUZZL',
  'SMART', 'CREAM', 'SHAPE', 'STONE', 'BOARD',
  'STAMP', 'FLAME', 'LIGHT', 'GRAPE', 'CORAL',
  'LEAFY', 'HONEY', 'FRESH', 'MATCH', 'WORLD'
];

export const OPPONENTS: Opponent[] = [
  {
    id: 'gary',
    name: 'Guesser Gary',
    level: 'Letter Learner',
    avatar: '🦊',
    accuracy: 0.65,
    speedSeconds: 150
  },
  {
    id: 'clara',
    name: 'Clara Cleanwood',
    level: 'Word Explorer',
    avatar: '🦉',
    accuracy: 0.78,
    speedSeconds: 120
  },
  {
    id: 'wendy',
    name: 'Wordsmith Wendy',
    level: 'Pattern Finder',
    avatar: '🐨',
    accuracy: 0.90,
    speedSeconds: 90
  }
];

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak-7',
    title: 'Paper Chain Badge',
    description: 'Maintain a 7-day daily streak of puzzle mastery.',
    unlocked: false,
    iconType: 'streak-chain'
  },
  {
    id: 'solve-3',
    title: 'Golden Stack Badge',
    description: 'Solve any Word Puzzle within 3 attempts.',
    unlocked: false,
    iconType: 'triple-tile'
  },
  {
    id: 'commit-reveal',
    title: 'Secure Sealer Badge',
    description: 'Complete a Match Duel using secure Commit-Reveal verification.',
    unlocked: false,
    iconType: 'envelope'
  },
  {
    id: 'verify-lookup',
    title: 'True Detective Badge',
    description: 'Inspect yesterday\'s proof of fairness in the Verification Center.',
    unlocked: false,
    iconType: 'magnifier'
  }
];

export const HISTORICAL_DAYS: VerifiedDay[] = [
  {
    date: '2026-08-03',
    word: 'HONEY',
    seed: 'warm-honey-9281-sweet',
    hash: '5a4fe2919d67ba6d2ee649ef92f2584cfb77f3a61bc5b7b966cfb7498c19eb9e',
    txSignature: '4zUv8Xb7Qp9Ym2vCwH8eN3nL8yB5uV8xC3sT4rK2fG1hD9aE5bJ6oW3qE4r',
    blockTime: '2026-08-03 23:59:12'
  },
  {
    date: '2026-08-02',
    word: 'CRAFT',
    seed: 'tactile-craft-1102-puzz',
    hash: '8f75b253b8b1a8dcf8c1e8c97cfb77a61bc5b7b966cfb7498c19eb9e248b111a',
    txSignature: '5uT8Xb7Qp9Ym2vCwH8eN3nL8yB5uV8xC3sT4rK2fG1hD9aE5bJ6oW3qE4rD3s8x',
    blockTime: '2026-08-02 23:58:44'
  },
  {
    date: '2026-08-01',
    word: 'SHAPE',
    seed: 'perfect-shape-5590-round',
    hash: 'cf7828c6fb253b8b1a8dc73bb22ff6cfb77f3a61bc5b7b966cfb7498c19eb9e782',
    txSignature: '2xR7vC3sT4rK2fG1hD9aE5bJ6oW3qE4rB5uV8x4zUv8Xb7Qp9Ym2vCwH8eN3nL8',
    blockTime: '2026-08-01 23:59:01'
  }
];

export function calculateLetterStates(guess: string, answer: string): ('correct' | 'present' | 'absent')[] {
  const states: ('correct' | 'present' | 'absent')[] = Array(5).fill('absent');
  const answerLetterCount: Record<string, number> = {};

  // Build letters count for those not in correct position
  for (let i = 0; i < 5; i++) {
    const char = answer[i];
    if (guess[i] === char) {
      states[i] = 'correct';
    } else {
      answerLetterCount[char] = (answerLetterCount[char] || 0) + 1;
    }
  }

  // Handle present letters
  for (let i = 0; i < 5; i++) {
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
