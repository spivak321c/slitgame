import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
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
  calculateLetterStates,
} from '../types';
import { sound } from '../utils/audio';
import { useBoardFit } from '../hooks/useBoardFit';
import { isEnglishWord, loadWordBank } from '../lib/dictionary';

interface PuzzleViewProps {
  onNavigate: (screen: ScreenType) => void;
  onSolve: (attempts: number, difficulty: Difficulty, won: boolean, guesses?: string[]) => void;
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
  const validatingRef = useRef(false);

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

  const submitValidGuess = useCallback((guess: string) => {
    sound.playKeyEnter();
    const nextGuesses = [...guesses, guess];
    setGuesses(nextGuesses);
    setCurrentGuess('');

    // Per-tile reveal audio, staggered to sync with the flip animation (colIdx * 0.08).
    // Matches the DuelView reveal pattern; each tile's pitch reflects its status.
    calculateLetterStates(guess, word).forEach((st, idx) =>
      sound.playTileReveal(idx * 0.08, st)
    );

    const won = guess === word;
    const lost = !won && nextGuesses.length >= maxAttempts;

    if (won) {
      sound.playWinSound();
      setStatus('won');
      onSolve(nextGuesses.length, difficulty.id, true, nextGuesses);
      setTimeout(() => setShowResult(true), 900);
    } else if (lost) {
      sound.playLoseSound();
      setStatus('lost');
      onSolve(nextGuesses.length, difficulty.id, false, nextGuesses);
      setTimeout(() => setShowResult(true), 900);
    }
  }, [guesses, word, maxAttempts, difficulty.id, onSolve]);

  // Preload the dictionary chunk for the current length so the first ENTER of
  // each difficulty resolves instantly (the async chunk is fetched in the
  // background on mount / difficulty switch, then cached forever).
  useEffect(() => {
    void loadWordBank(wordLength);
  }, [wordLength]);

  const submitGuess = useCallback(() => {
    if (status !== 'playing') return;
    const guess = currentGuess.trim().toUpperCase();
    if (guess.length !== wordLength) return;

    // Async dictionary check: the word bank for this length is preloaded on
    // mount/difficulty-change, so this resolves in ~0ms after the first game
    // of each length. The ref guards against a double-submit while loading.
    void (async () => {
      if (validatingRef.current) return;
      validatingRef.current = true;
      let valid = false;
      try {
        valid = await isEnglishWord(wordLength, guess);
      } finally {
        validatingRef.current = false;
      }
      if (!valid) {
        sound.playShakeSound();
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      submitValidGuess(guess);
    })();
  }, [status, currentGuess, wordLength, submitValidGuess]);

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

  // Tile size that makes the whole board fit the available height — no
  // internal scroll, exactly like wordle.global. No reserve: the "keys left"
  // strip is gone from this page, so the board owns the full middle.
  const { ref: boardFitRef, size: tileSize } = useBoardFit(
    maxAttempts,
    wordLength,
    8,
    28,
    78,
    0
  );

  const statusColor: Record<TileResult['status'], string> = {
    correct: 'bg-[#79B96B] border-[#5E9A50] text-white shadow-[0_2px_0_#5E9A50]',
    present: 'bg-[#F2B84B] border-[#D99B28] text-white shadow-[0_2px_0_#D99B28]',
    absent: 'bg-[#E7DCCB] border-[#D8CBB5] text-[#998D85] shadow-xs',
    empty: 'bg-[#FFFCF7] border-2 border-[#E7DCCB] text-transparent shadow-xs',
    current: 'bg-[#FFFCF7] border-2 border-[#F2B84B] text-[#3D342F] shadow-xs',
  };

  return (
    <div className="h-full max-w-4xl mx-auto px-3 sm:px-4 pt-3 flex flex-col overflow-hidden">
      {/* Header: back + title + difficulty tabs */}
      <div className="flex-none flex flex-col sm:flex-row sm:items-center gap-3 mb-2 sm:mb-3">
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
        <div className="flex gap-1.5 sm:gap-2 sm:ml-auto flex-none items-center">
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
                title={`${cfg.label} — ${cfg.wordLength} letters · ${cfg.attempts} tries`}
                aria-label={`${cfg.label} ${cfg.wordLength} letters`}
                className={`px-3 py-1.5 rounded-xl border-2 font-display font-extrabold text-xs leading-none transition-all cursor-pointer flex items-baseline gap-1 whitespace-nowrap ${
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
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'opacity-85' : 'text-[#998D85]'}`}>
                  {cfg.wordLength}
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
            className="flex-none mb-2"
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

      {/* Board area: fills the middle. Tiles are sized to fit this exact
          space, so the grid never needs an internal scroll container. */}
      <div ref={boardFitRef} className="flex-1 min-h-0 flex flex-col items-center justify-center py-2">
        <div className="flex w-full flex-col items-center">
        <motion.div
          key={`${difficulty.id}-${word}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex justify-center ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
        >
        <div className={`board-grid grid gap-2 ${wordLength === 4 ? 'grid-cols-4' : wordLength === 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
          {rows.flatMap((row, rowIdx) =>
            row.map((tile, colIdx) => {
              const shouldFlip =
                rowIdx < guesses.length;
              // Pop only tiles in the row actively being typed, and only once
              // they hold a letter. The span remounts (key = letter) so each
              // keystroke replays a springy "letterpress stamp". The outer tile
              // keeps its stable key + flip animation untouched.
              const popLetter = rowIdx === guesses.length && tile.letter !== '';
              // Winning row: after its flip lands, hop each tile in a wave.
              const isWinningRow = status === 'won' && rowIdx === guesses.length - 1;
              return (
                <motion.div
                  key={`${rowIdx}-${colIdx}`}
                  initial={false}
                  animate={
                    shouldFlip
                      ? {
                          rotateX: [0, 90, 0],
                          backgroundColor: ['#FFFCF7', '#FFFCF7', ''],
                          ...(isWinningRow ? { y: [0, -18, 0, -6, 0] } : {}),
                        }
                      : {}
                  }
                  transition={
                    isWinningRow
                      ? {
                          // Flip timing stays identical to normal rows.
                          rotateX: { duration: 0.5, delay: colIdx * 0.08, ease: 'easeInOut' },
                          backgroundColor: { duration: 0.5, delay: colIdx * 0.08, ease: 'easeInOut' },
                          // Hop starts once this tile's flip has landed.
                          y: {
                            duration: 0.6,
                            delay: 0.6 + colIdx * 0.08,
                            times: [0, 0.35, 0.65, 0.85, 1],
                            ease: ['easeOut', 'easeIn', 'easeOut', 'easeIn'],
                          },
                        }
                      : { duration: 0.5, delay: colIdx * 0.08, ease: 'easeInOut' }
                  }
                  className={`game-tile rounded-xl flex items-center justify-center font-logo font-black text-xl sm:text-2xl select-none ${
                    statusColor[tile.status] ?? statusColor.empty
                  }`}
                  style={{
                    width: tileSize ?? 44,
                    height: tileSize ?? 44,
                    fontSize: tileSize ? Math.max(16, Math.round(tileSize * 0.5)) : undefined,
                  }}
                >
                  <motion.span
                    key={tile.letter}
                    initial={popLetter ? { scale: 0.3, opacity: 0 } : false}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 520, damping: 20 }}
                    className="inline-block"
                  >
                    {tile.letter}
                  </motion.span>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
        </div>
      </div>

      {/* Keyboard: pinned to the bottom of the play shell (thumb zone) */}
      <div className="flex-none mt-2 pb-1">
        <div className="flex justify-center mb-2 text-[11px] font-display font-bold text-[#998D85] items-center gap-1.5">
          <Keyboard className="w-3.5 h-3.5" /> Type with your real keyboard or tap below
        </div>
        <div className="flex flex-col items-center gap-1.5">
          {KEY_ROWS.map((row, i) => (
            <div key={i} className="osk-row flex gap-1 sm:gap-1.5">
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