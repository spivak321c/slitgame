import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Delete,
  Keyboard,
  RotateCcw,
  Zap,
  Trophy,
  Coins,
  Flame,
  Shield,
} from 'lucide-react';

import {
  ScreenType,
  Difficulty,
  DIFFICULTIES,
  DifficultyConfig,
  randomWord,
  wordsForLength,
  calculateLetterStates,
} from '../types';
import { sound } from '../utils/audio';
import AttemptKeys from './AttemptKeys';

interface PuzzleViewProps {
  onNavigate: (screen: ScreenType) => void;
  onSolve: (attempts: number, difficulty: Difficulty, won: boolean) => void;
}

const KEY_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK'],
];

interface TileResult {
  letter: string;
  status: 'correct' | 'present' | 'absent' | 'empty' | 'current';
}

export default function PuzzleView({ onNavigate, onSolve }: PuzzleViewProps) {
  const [difficulty, setDifficulty] = useState<DifficultyConfig>(DIFFICULTIES[1]);
  const [word, setWord] = useState<string>(() => randomWord(DIFFICULTIES[1].wordLength));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shake, setShake] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const wordLength = difficulty.wordLength;
  const maxAttempts = difficulty.attempts;

  const resetGame = useCallback(
    (cfg?: DifficultyConfig) => {
      const config = cfg ?? difficulty;
      setDifficulty(config);
      setWord(randomWord(config.wordLength));
      setGuesses([]);
      setCurrentGuess('');
      setStatus('playing');
      setShowResult(false);
    },
    [difficulty]
  );

  const keyboardStates = useMemo(() => {
    const map: Record<string, 'correct' | 'present' | 'absent'> = {};
    guesses.forEach(guess => {
      calculateLetterStates(guess, word).forEach((state, idx) => {
        const letter = guess[idx];
        const priority = state === 'correct' ? 3 : state === 'present' ? 2 : 1;
        const current = map[letter] === 'correct' ? 3 : map[letter] === 'present' ? 2 : 0;
        if (priority >= current) map[letter] = state;
      });
    });
    return map;
  }, [guesses, word]);

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return;
    const guess = currentGuess.trim().toUpperCase();
    if (guess.length !== wordLength) return;
    if (!wordsForLength(wordLength).includes(guess)) {
      sound.playShakeSound();
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    sound.playKeyEnter();
    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    const won = guess === word;
    const lost = !won && nextGuesses.length >= maxAttempts;

    if (won) {
      sound.playWinSound();
      setStatus('won');
      onSolve(nextGuesses.length, difficulty.id, true);
      setTimeout(() => setShowResult(true), 900);
    } else if (lost) {
      sound.playLoseSound();
      setStatus('lost');
      onSolve(nextGuesses.length, difficulty.id, false);
      setTimeout(() => setShowResult(true), 900);
    }
  }, [status, currentGuess, wordLength, guesses, word, maxAttempts, difficulty.id, onSolve]);

  const handleKeyPress = useCallback(
    (key: string) => {
      if (status !== 'playing') return;

      if (key === 'BACK') {
        sound.playKeyDelete();
        setCurrentGuess(prev => prev.slice(0, -1));
        return;
      }
      if (key === 'ENTER') {
        submitGuess();
        return;
      }
      if (currentGuess.length < wordLength) {
        sound.playKeyPress();
        setCurrentGuess(prev => prev + key);
      }
    },
    [status, currentGuess, wordLength, submitGuess]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyPress('BACK');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKeyPress]);

  // Build the tile grid
  const rows: TileResult[][] = Array.from({ length: maxAttempts }).map((_, rowIdx) => {
    if (rowIdx < guesses.length) {
      const guess = guesses[rowIdx];
      const states = calculateLetterStates(guess, word);
      return guess.split('').map((letter, i) => ({ letter, status: states[i] }));
    }
    if (rowIdx === guesses.length) {
      return Array.from({ length: wordLength }).map((_, i) => ({
        letter: currentGuess[i] ?? '',
        status: 'current' as const,
      }));
    }
    return Array.from({ length: wordLength }).map(() => ({ letter: '', status: 'empty' as const }));
  });

  const winCoins = difficulty.baseReward + Math.max(0, maxAttempts - guesses.length) * 2;

  const statusColor: Record<TileResult['status'], string> = {
    correct: 'bg-[#79B96B] border-[#5E9A50] text-white shadow-[0_2px_0_#5E9A50]',
    present: 'bg-[#F2B84B] border-[#D99B28] text-white shadow-[0_2px_0_#D99B28]',
    absent: 'bg-[#E7DCCB] border-[#D8CBB5] text-[#998D85] shadow-xs',
    empty: 'bg-[#FFFCF7] border-2 border-[#E7DCCB] text-transparent shadow-xs',
    current: 'bg-[#FFFCF7] border-2 border-[#F2B84B] text-[#3D342F] shadow-xs',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Header: back + title + difficulty tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => onNavigate('dashboard')}
            whileTap={{ scale: 0.92 }}
            className="p-2 bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-xl text-[#6F625B] hover:text-[#3D342F] hover:border-[#A69485] transition-colors cursor-pointer"
            aria-label="Back to workshop"
          >
            <ArrowLeft className="w-4.5 h-4.5" />
          </motion.button>
          <div>
            <h1 className="font-logo font-black text-2xl sm:text-3xl text-[#3D342F] flex items-center gap-2">
              <Flame className="w-6 h-6 text-[#F28C6F]" />
              Puzzle Pit
            </h1>
            <p className="text-xs text-[#998D85] font-display font-semibold">Pick a difficulty and start guessing</p>
          </div>
        </div>

        {/* Difficulty selector */}
        <div className="flex gap-2 sm:ml-auto">
          {DIFFICULTIES.map(cfg => {
            const isActive = difficulty.id === cfg.id;
            return (
              <motion.button
                key={cfg.id}
                onClick={() => {
                  if (status !== 'playing' || guesses.length === 0) {
                    sound.playKeyPress();
                    resetGame(cfg);
                  } else {
                    sound.playShakeSound();
                  }
                }}
                whileTap={{ scale: 0.94 }}
                className={`px-3.5 py-2 rounded-xl border-2 font-display font-extrabold text-xs transition-all cursor-pointer ${
                  isActive
                    ? cfg.id === 'easy'
                      ? 'bg-[#79B96B] border-[#5E9A50] text-white shadow-[0_2px_0_#5E9A50]'
                      : cfg.id === 'classic'
                        ? 'bg-[#E45C75] border-[#AF324B] text-white shadow-[0_2px_0_#AF324B]'
                        : 'bg-[#8B72C9] border-[#6B55A8] text-white shadow-[0_2px_0_#6B55A8]'
                    : 'bg-[#FFFCF7] border-[#E7DCCB] text-[#6F625B] hover:border-[#A69485]'
                }`}
              >
                {cfg.label}
                <span className="block text-[9px] font-mono font-bold opacity-80">
                  {cfg.wordLength} letters · {cfg.attempts} tries
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Results panel */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="mb-6"
          >
            <div className={`relative overflow-hidden rounded-3xl border-2 p-5 sm:p-6 text-left ${
              status === 'won'
                ? 'bg-gradient-to-br from-[#F5FFF2] to-[#EAF7E5] border-[#79B96B]'
                : 'bg-gradient-to-br from-[#FFF8F6] to-[#FDF0EC] border-[#F28C6F]'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {status === 'won' ? (
                  <Trophy className="w-5 h-5 text-[#D99B28]" />
                ) : (
                  <Flame className="w-5 h-5 text-[#F28C6F]" />
                )}
                <h2 className="font-logo font-black text-xl text-[#3D342F]">
                  {status === 'won' ? 'Puzzle Solved!' : 'Out of Keys...'}
                </h2>
              </div>

              {status === 'won' ? (
                <p className="text-sm text-[#6F625B] mb-3">
                  You cracked <span className="font-logo font-bold">{word}</span> in {guesses.length}{' '}
                  {guesses.length === 1 ? 'guess' : 'guesses'}! The bonus coin drops are yours.
                </p>
              ) : (
                <p className="text-sm text-[#6F625B] mb-3">
                  The word was <span className="font-logo font-bold text-[#E45C75]">{word}</span>. A
                  little participation bonus is all yours — try again!
                </p>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {status === 'won' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFCF7] border border-[#E7DCCB] rounded-full text-xs font-mono font-bold text-[#3D342F]">
                    <Coins className="w-3.5 h-3.5 text-[#F2B84B]" /> +{winCoins} coins
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFCF7] border border-[#E7DCCB] rounded-full text-xs font-mono font-bold text-[#3D342F]">
                  <Zap className="w-3.5 h-3.5 text-[#8B72C9]" /> +{status === 'won' ? difficulty.xpReward : 10} XP
                </span>
                {status === 'lost' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFCF7] border border-[#E7DCCB] rounded-full text-xs font-mono font-bold text-[#3D342F]">
                    <Coins className="w-3.5 h-3.5 text-[#F2B84B]" /> +5 coins
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <motion.button
                  onClick={() => {
                    sound.playKeyPress();
                    resetGame();
                    setShowResult(false);
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#3D342F] text-[#FFFCF7] rounded-xl font-display font-bold text-xs hover:bg-[#4E433C] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Play Again
                </motion.button>
                <motion.button
                  onClick={() => onNavigate('duel')}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#FFFCF7] border-2 border-[#E7DCCB] text-[#3D342F] rounded-xl font-display font-bold text-xs hover:border-[#F28C6F] hover:text-[#F28C6F] transition-colors cursor-pointer"
                >
                  <Shield className="w-4 h-4" /> Take on a Duel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Word grid */}
      <motion.div
        key={`${difficulty.id}-${word}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex justify-center ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      >
        <div className={`grid gap-1.5 sm:gap-2 ${wordLength === 4 ? 'grid-cols-4' : wordLength === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
          {rows.flatMap((row, rowIdx) =>
            row.map((tile, colIdx) => {
              const shouldFlip =
                rowIdx < guesses.length;
              return (
                <motion.div
                  key={`${rowIdx}-${colIdx}`}
                  initial={false}
                  animate={
                    shouldFlip
                      ? {
                          rotateX: [0, 90, 0],
                          backgroundColor: ['#FFFCF7', '#FFFCF7', ''],
                        }
                      : {}
                  }
                  transition={{ duration: 0.5, delay: colIdx * 0.08, ease: 'easeInOut' }}
                  className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center font-logo font-black text-xl sm:text-2xl select-none ${
                    statusColor[tile.status] ?? statusColor.empty
                  }`}
                >
                  {tile.letter}
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>

      <div className="flex justify-center mt-4">
        <AttemptKeys maxAttempts={maxAttempts} usedAttempts={guesses.length} />
      </div>

      {/* Keyboard */}
      <div className="mt-6 sm:mt-8">
        <div className="flex justify-center mb-2 text-[11px] font-display font-bold text-[#998D85] items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5" /> Type with your real keyboard or tap below
        </div>
        <div className="flex flex-col items-center gap-1.5">
          {KEY_ROWS.map((row, i) => (
            <div key={i} className="flex gap-1 sm:gap-1.5">
              {row.map(key => {
                const letterKey = key === 'ENTER' || key === 'BACK' ? '' : key;
                const state = letterKey ? keyboardStates[letterKey] : undefined;
                const isWide = key === 'ENTER' || key === 'BACK';
                return (
                  <motion.button
                    key={key}
                    onClick={() => handleKeyPress(key)}
                    whileTap={{ scale: 0.9 }}
                    className={`${isWide ? 'px-2.5 text-[9px] sm:px-3.5 sm:text-[10px]' : 'w-8 h-11 sm:w-9 sm:h-12 text-xs sm:text-sm'} h-11 sm:h-12 rounded-lg font-display font-extrabold transition-colors cursor-pointer flex items-center justify-center ${
                      state === 'correct'
                        ? 'bg-[#79B96B] text-white'
                        : state === 'present'
                          ? 'bg-[#F2B84B] text-white'
                          : state === 'absent'
                            ? 'bg-[#EAE2D4] text-[#998D85]'
                            : 'bg-[#FFFCF7] border-2 border-[#E7DCCB] text-[#3D342F] hover:border-[#A69485]'
                    }`}
                  >
                    {key === 'BACK' ? <Delete className="w-4 h-4" /> : key === 'ENTER' ? <Check className="w-4 h-4" /> : key}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}