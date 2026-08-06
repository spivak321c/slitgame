import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, RefreshCw, Flame, ArrowLeft, CheckCircle, ShieldAlert, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { ScreenType, WalletState, calculateLetterStates } from '../types';
import { sound } from '../utils/audio';
import HowToPlayModal from './HowToPlayModal';

interface DailyPuzzleViewProps {
  onNavigate: (screen: ScreenType) => void;
  isDaily: boolean;
  dailySolved: boolean;
  setDailySolved: (solved: boolean) => void;
  onSolve: (attempts: number) => void;
  wallet: WalletState;
  onConnectWallet: () => void;
  onDeductBalance: (amount: number) => void;
}

export default function DailyPuzzleView({
  onNavigate,
  isDaily,
  dailySolved,
  setDailySolved,
  onSolve,
  wallet,
  onConnectWallet,
  onDeductBalance,
}: DailyPuzzleViewProps) {
  // Configured Word for today or Practice
  const defaultWord = isDaily ? 'CRAFT' : 'TEACH';
  const [word, setWord] = useState(defaultWord);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  
  // Transaction Preview State
  const [showSaveTx, setShowSaveTx] = useState(false);
  const [txDetailsOpen, setTxDetailsOpen] = useState(false);
  const [txSaved, setTxSaved] = useState(false);
  const [savingTx, setSavingTx] = useState(false);
  
  // Custom technical info modal
  const [infoOpen, setInfoOpen] = useState(false);
  const [howToPlayModalOpen, setHowToPlayModalOpen] = useState(false);

  // Initialize Word
  useEffect(() => {
    if (isDaily) {
      setWord('CRAFT'); // Daily puzzle word
      // If daily was already solved, show it completed
      if (dailySolved) {
        setGuesses(['CRAFT']);
        setGameStatus('won');
      } else {
        setGuesses([]);
        setCurrentGuess('');
        setGameStatus('playing');
      }
    } else {
      // Pick a random word from bank for practice
      const practiceWords = ['TEACH', 'WRITE', 'SMART', 'CREAM', 'SHAPE', 'STONE', 'BOARD', 'STAMP', 'FLAME', 'LIGHT'];
      const randomWord = practiceWords[Math.floor(Math.random() * practiceWords.length)];
      setWord(randomWord);
      setGuesses([]);
      setCurrentGuess('');
      setGameStatus('playing');
    }
    setTxSaved(false);
    setShowSaveTx(false);
  }, [isDaily, dailySolved]);

  // Keys structure for virtual keyboard
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
  ];

  // Map keyboard colors based on guess states
  const getLetterStatus = (letter: string) => {
    let bestStatus: 'correct' | 'present' | 'absent' | null = null;
    guesses.forEach(guess => {
      for (let i = 0; i < 5; i++) {
        if (guess[i] === letter) {
          const state = calculateLetterStates(guess, word)[i];
          if (state === 'correct') {
            bestStatus = 'correct';
          } else if (state === 'present' && bestStatus !== 'correct') {
            bestStatus = 'present';
          } else if (state === 'absent' && !bestStatus) {
            bestStatus = 'absent';
          }
        }
      }
    });
    return bestStatus;
  };

  // Keyboard Handlers
  const handleKeyPress = (key: string) => {
    if (gameStatus !== 'playing') return;

    if (key === 'DELETE') {
      sound.playKeyDelete();
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      if (currentGuess.length < 5) {
        sound.playShakeSound();
        // Shake row
        setShakeRow(guesses.length);
        setTimeout(() => setShakeRow(null), 250);
        return;
      }
      
      sound.playKeyEnter();
      const submitted = currentGuess.toUpperCase();
      const newGuesses = [...guesses, submitted];
      setGuesses(newGuesses);
      
      // Calculate letter status for flip audio & animations
      const states = calculateLetterStates(submitted, word);
      states.forEach((st, idx) => {
        sound.playTileReveal(idx * 0.12, st);
      });

      // Check Win / Lose after tile flip sequence
      const isWin = submitted === word;
      const isLoss = newGuesses.length >= 6 && !isWin;

      setTimeout(() => {
        if (isWin) {
          sound.playWinSound();
          setGameStatus('won');
          if (isDaily) {
            setDailySolved(true);
          }
          onSolve(newGuesses.length);
        } else if (isLoss) {
          sound.playLoseSound();
          setGameStatus('lost');
        }
      }, 500);

      setCurrentGuess('');
    } else if (/^[A-Z]$/i.test(key)) {
      if (currentGuess.length < 5) {
        sound.playKeyPress();
        setCurrentGuess(prev => (prev + key).toUpperCase());
      }
    }
  };

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Backspace') {
        handleKeyPress('DELETE');
      } else if (e.key === 'Enter') {
        handleKeyPress('ENTER');
      } else {
        handleKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, guesses, gameStatus, word]);

  // Restart practice
  const handleRestartPractice = () => {
    const practiceWords = ['TEACH', 'WRITE', 'SMART', 'CREAM', 'SHAPE', 'STONE', 'BOARD', 'STAMP', 'FLAME', 'LIGHT'];
    const randomWord = practiceWords[Math.floor(Math.random() * practiceWords.length)];
    setWord(randomWord);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
  };

  // Simulate saving result on-chain
  const handleSaveResultOnChain = () => {
    setSavingTx(true);
    setTimeout(() => {
      setSavingTx(false);
      setTxSaved(true);
      onDeductBalance(0.00085); // Simulated small gas fee
    }, 1800);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col justify-between min-h-[85vh]">
      
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E7DCCB]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <button
            onClick={() => setHowToPlayModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 bg-[#FAF4EA] hover:bg-[#F4EBDD] border border-[#E7DCCB] rounded-full text-xs text-[#3D342F] font-bold font-display transition-colors cursor-pointer shrink-0"
            title="Open How to Play Guide"
            aria-label="How to Play Guide"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#65B9E8] shrink-0" />
            <span className="hidden sm:inline">How to Play</span>
            <span className="sm:hidden text-[11px]">Help</span>
          </button>

          {isDaily ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFF3D6] border border-[#F2B84B] rounded-full text-xs text-[#3D342F] font-bold">
              <Lock className="w-3.5 h-3.5 text-[#F2B84B]" />
              <span>Locked ✓</span>
              <button
                onClick={() => setInfoOpen(!infoOpen)}
                className="w-4 h-4 rounded-full bg-[#3D342F]/10 hover:bg-[#3D342F]/20 flex items-center justify-center font-bold text-[10px]"
                title="View Technical Fairness Proof"
              >
                ?
              </button>
            </div>
          ) : (
            <span className="px-3 py-1 bg-[#E7F5FC] text-[#65B9E8] rounded-full text-xs font-bold font-display uppercase tracking-wider">
              Practice Mode
            </span>
          )}
        </div>
      </div>

      {/* Proof of fairness explanation box */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-[#FFF3D6] border border-[#F2B84B] rounded-2xl p-4 mb-4 text-xs text-[#3D342F] leading-relaxed relative overflow-hidden"
          >
            <h4 className="font-logo font-bold text-sm mb-1">Cryptographic Security</h4>
            <p className="mb-2">
              Before anyone begins playing, Slotword generates and locks the daily secret answer hash (SHA-256) on-chain. Tomorrow, the seed and solution are revealed and validated dynamically by smart contracts in the <strong>Verification Center</strong>. This guarantees that organizers cannot change the word mid-day.
            </p>
            <div className="font-mono text-[10px] text-[#6F625B] bg-[#FFFCF7]/60 p-2 rounded border border-[#E7DCCB] break-all">
              Locked Commit Hash: sha256("craft-seed-7182-solved") = 8f75b253b8b1a8dcf8c1e8c97cfb77a61bc5b7...
            </div>
            <button
              onClick={() => setInfoOpen(false)}
              className="absolute right-2 top-2 text-[#6F625B] hover:text-[#3D342F] font-bold text-xs"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Puzzle Grid Container */}
      <div className="flex-1 flex flex-col justify-center items-center py-4">
        <div className="grid grid-rows-6 gap-2 w-full max-w-[280px]">
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const isCurrentRow = rowIndex === guesses.length;
            const isCompletedRow = rowIndex < guesses.length;
            const guessVal = isCurrentRow
              ? currentGuess.padEnd(5, ' ')
              : isCompletedRow
              ? guesses[rowIndex]
              : '     ';
              
            const isShaking = shakeRow === rowIndex;

            return (
              <motion.div
                key={rowIndex}
                className="grid grid-cols-5 gap-2"
                animate={isShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.25 }}
              >
                {Array.from({ length: 5 }).map((_, colIndex) => {
                  const letter = guessVal[colIndex]?.trim() || '';
                  
                  // Calculate state
                  let cellBg = 'bg-[#FFFCF7]';
                  let cellBorder = 'border-[#D8CCBC]';
                  let cellText = 'text-[#3D342F]';
                  let symbol = null;
                  let flip = false;

                  if (isCompletedRow) {
                    flip = true;
                    const states = calculateLetterStates(guesses[rowIndex], word);
                    const state = states[colIndex];
                    if (state === 'correct') {
                      cellBg = 'bg-[#79B96B]';
                      cellBorder = 'border-[#5C9B50]';
                      cellText = 'text-white';
                      symbol = '●'; // Dot for correct
                    } else if (state === 'present') {
                      cellBg = 'bg-[#F2B84B]';
                      cellBorder = 'border-[#D99B28]';
                      cellText = 'text-[#3D342F]';
                      symbol = '▲'; // Triangle for present
                    } else {
                      cellBg = 'bg-[#AFA8A3]';
                      cellBorder = 'border-[#918984]';
                      cellText = 'text-white';
                      symbol = '✕'; // Cross for absent
                    }
                  } else if (letter) {
                    cellBg = 'bg-[#FFF4E5]';
                    cellBorder = 'border-[#A99B8D]';
                  }

                  return (
                    <motion.div
                      key={colIndex}
                      id={`tile-${rowIndex}-${colIndex}`}
                      className={`w-11 h-11 xs:w-12 xs:h-12 sm:w-13 sm:h-13 rounded-xl border-2 ${cellBg} ${cellBorder} ${cellText} flex flex-col items-center justify-center font-logo font-bold text-lg sm:text-xl select-none relative shadow-sm`}
                      initial={{ scale: 1, rotateX: 0 }}
                      animate={
                        flip
                          ? { rotateX: [0, 90, 0], scale: [1, 1.08, 1] }
                          : letter && isCurrentRow
                          ? { scale: [0.92, 1.12, 1], rotate: [0, 2, 0] }
                          : {}
                      }
                      transition={
                        flip
                          ? {
                              duration: 0.35,
                              delay: colIndex * 0.12,
                              ease: 'easeInOut',
                            }
                          : {
                              duration: 0.14,
                              ease: [0.34, 1.56, 0.64, 1],
                            }
                      }
                    >
                      <span>{letter}</span>
                      
                      {/* Optional Accessibility Symbols (Section 5) */}
                      {symbol && (
                        <span className="absolute bottom-0.5 right-1 text-[7px] opacity-75 font-mono font-bold">
                          {symbol}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Game Ends Message & Verification Save */}
      <AnimatePresence>
        {gameStatus !== 'playing' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-5 shadow-raised mb-6 text-center max-w-sm mx-auto"
          >
            <div className="flex justify-center mb-2">
              <span className="text-4xl">
                {gameStatus === 'won' ? '🎉' : '🦉'}
              </span>
            </div>
            
            <h3 className="text-xl font-logo font-extrabold text-[#3D342F] mb-1">
              {gameStatus === 'won' ? 'Splendid solve!' : 'So close!'}
            </h3>
            <p className="text-sm text-[#6F625B] mb-4">
              {gameStatus === 'won'
                ? `You correctly figured out today's locked word "${word}" in ${guesses.length} attempts.`
                : `The secret word was "${word}". Keep practicing to build pattern recognition.`}
            </p>

            {isDaily ? (
              <div>
                {!txSaved ? (
                  <button
                    onClick={() => setShowSaveTx(true)}
                    className="w-full py-3 bg-[#E45C75] hover:bg-[#C94360] text-white font-display font-bold text-sm rounded-xl shadow-raised transition-all cursor-pointer"
                  >
                    Save Verified Result
                  </button>
                ) : (
                  <div className="p-3 bg-[#EAF5E7] border border-[#79B96B] rounded-xl text-[#79B96B] text-xs font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    <span>Result Saved and Streak Secured On-Chain!</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleRestartPractice}
                className="w-full py-3 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Play Another Practice Word
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tactile Virtual Keyboard (Mobile-optimized touch key sizes & fluid flex layout) */}
      <div className="w-full max-w-lg mx-auto mb-2 px-1 select-none">
        {keyboardRows.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1 sm:gap-1.5 my-1">
            {row.map(key => {
              const letterStatus = getLetterStatus(key);
              
              // Styles
              let keyBg = 'bg-[#F4EBDD] active:bg-[#E7DCCB] hover:bg-[#E7DCCB] text-[#3D342F]';
              if (letterStatus === 'correct') {
                keyBg = 'bg-[#79B96B] text-white';
              } else if (letterStatus === 'present') {
                keyBg = 'bg-[#F2B84B] text-[#3D342F]';
              } else if (letterStatus === 'absent') {
                keyBg = 'bg-[#AFA8A3] text-white';
              }

              const isWide = key === 'ENTER' || key === 'DELETE';

              return (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  className={`${
                    isWide
                      ? 'px-2 sm:px-3 h-11 sm:h-12 text-[10px] sm:text-xs shrink-0'
                      : 'flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm md:text-base'
                  } font-logo font-extrabold rounded-lg ${keyBg} transition-all active:scale-95 flex items-center justify-center shadow-xs cursor-pointer touch-manipulation`}
                >
                  {key === 'DELETE' ? '⌫' : key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* TRANSACTION PREVIEW MODAL (Section 12 - Transaction Previews) */}
      <AnimatePresence>
        {showSaveTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D342F]/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-6 shadow-raised max-w-sm w-full relative"
            >
              <h3 className="text-xl font-logo font-extrabold text-[#3D342F] mb-4">
                Save your result
              </h3>

              {/* Benefits Checklist */}
              <div className="space-y-2.5 mb-6 text-left">
                <div className="flex items-start gap-2 text-sm text-[#3D342F]">
                  <span className="text-[#79B96B] font-bold">✓</span>
                  <span>Add today’s solve to your profile</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-[#3D342F]">
                  <span className="text-[#79B96B] font-bold">✓</span>
                  <span>Protect your 7-day streak</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-[#3D342F]">
                  <span className="text-[#79B96B] font-bold">✓</span>
                  <span>Place you on today’s leaderboard</span>
                </div>
              </div>

              {/* Cost Summary Box */}
              <div className="bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl p-4 space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6F625B]">Transaction Cost</span>
                  <span className="font-mono text-[#3D342F] font-bold">Less than 0.001 SOL</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#6F625B]">Money moved</span>
                  <span className="font-mono text-[#79B96B] font-bold">None</span>
                </div>
              </div>

              {/* Expandable Technical Details */}
              <div className="border-t border-[#E7DCCB] pt-3 mb-6">
                <button
                  onClick={() => setTxDetailsOpen(!txDetailsOpen)}
                  className="w-full flex justify-between items-center text-xs text-[#6F625B] font-display font-semibold hover:text-[#3D342F]"
                >
                  <span>See transaction details</span>
                  {txDetailsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {txDetailsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-3 text-left space-y-2"
                    >
                      <div className="text-[10px] font-mono text-[#998D85] bg-[#FFF9F0] p-2.5 rounded-lg border border-[#E7DCCB] leading-relaxed break-all">
                        <div><strong>Program ID:</strong> SlotW1d5V98axC...</div>
                        <div><strong>Instruction:</strong> SaveSolverRecord(guesses: {JSON.stringify(guesses)}, speed: 84s)</div>
                        <div><strong>Signer:</strong> {wallet.connected ? wallet.address : 'DemoAddress...'}</div>
                        <div><strong>Data Account:</strong> PDASlotwordState...</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {wallet.connected ? (
                  <button
                    onClick={handleSaveResultOnChain}
                    disabled={savingTx || txSaved}
                    className="w-full py-3.5 bg-[#E45C75] hover:bg-[#C94360] text-white font-display font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {savingTx ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Sealing results...
                      </span>
                    ) : (
                      'Save Verified Record'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={onConnectWallet}
                    className="w-full py-3.5 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-bold text-sm rounded-xl transition-all shadow-sm"
                  >
                    Connect Wallet to Save
                  </button>
                )}
                
                <button
                  onClick={() => setShowSaveTx(false)}
                  disabled={savingTx}
                  className="w-full py-2.5 bg-transparent hover:bg-[#F4EBDD] text-[#6F625B] font-display font-semibold text-xs rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Kid-Friendly How to Play Help Modal */}
      <HowToPlayModal
        isOpen={howToPlayModalOpen}
        onClose={() => setHowToPlayModalOpen(false)}
      />

    </div>
  );
}
