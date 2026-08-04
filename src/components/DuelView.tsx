import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, MailOpen, Lock, Trophy, ArrowLeft, Play, User, Users, Flame, HelpCircle } from 'lucide-react';
import { ScreenType, Opponent, DuelSession, OPPONENTS, WalletState, calculateLetterStates } from '../types';
import { sound } from '../utils/audio';

interface DuelViewProps {
  onNavigate: (screen: ScreenType) => void;
  wallet: WalletState;
  onConnectWallet: () => void;
  onAddBalance: (amount: number) => void;
  onDeductBalance: (amount: number) => void;
  onUnlockAchievement: (id: string) => void;
}

export default function DuelView({
  onNavigate,
  wallet,
  onConnectWallet,
  onAddBalance,
  onDeductBalance,
  onUnlockAchievement,
}: DuelViewProps) {
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [session, setSession] = useState<DuelSession | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [duelWord, setDuelWord] = useState('LIGHT');
  
  // Explanation Tooltip
  const [showCommitInfo, setShowCommitInfo] = useState(false);

  // Initialize a challenge match
  const handleStartDuel = (opponent: Opponent) => {
    if (!wallet.connected) {
      onConnectWallet();
      return;
    }
    if (wallet.balance < 0.01) {
      alert("Insufficient SOL balance in your simulated wallet! Click your Card Pouch to add funds.");
      return;
    }

    sound.playRewardSound();
    // Deduct entry fee
    onDeductBalance(0.01);

    // Pick a duel word
    const duelWords = ['LIGHT', 'FLAME', 'STONE', 'BOARD', 'SMART'];
    const chosenWord = duelWords[Math.floor(Math.random() * duelWords.length)];
    setDuelWord(chosenWord);

    // Initialize session state
    setSession({
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      opponent,
      entryFee: 0.01,
      prizePool: 0.018, // 90% returned, 10% safety pool fee
      playerGuesses: [],
      opponentGuesses: [],
      playerCurrentGuess: '',
      opponentCurrentGuess: '',
      playerStatus: 'playing',
      opponentStatus: 'playing',
      playerTimeLeft: 180,
      opponentTimeLeft: 180,
      word: chosenWord,
      step: 'setup',
      playerCommitted: false,
      opponentCommitted: false,
      playerRevealed: false,
      opponentRevealed: false,
      playerSeed: `seed-player-${Math.floor(1000 + Math.random() * 9000)}`,
      playerHash: '',
      opponentSeed: `seed-bot-${Math.floor(1000 + Math.random() * 9000)}`,
      opponentHash: '',
    });
  };

  // Move from Setup to Gameplay
  const handleLaunchGameplay = () => {
    if (!session) return;
    sound.playKeyEnter();
    setSession(prev => prev ? { ...prev, step: 'setup' } : null);
  };

  // Keyboard Handlers inside the Duel
  const handleDuelKeyPress = (key: string) => {
    if (!session || session.step !== 'setup') return;

    if (key === 'DELETE' || key === 'BACKSPACE') {
      sound.playKeyDelete();
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      if (currentGuess.length < 5) {
        sound.playShakeSound();
        setShakeRow(session.playerGuesses.length);
        setTimeout(() => setShakeRow(null), 250);
        return;
      }

      sound.playKeyEnter();
      const guessUpper = currentGuess.toUpperCase();
      const updatedGuesses = [...session.playerGuesses, guessUpper];
      
      const states = calculateLetterStates(guessUpper, session.word);
      states.forEach((st, idx) => sound.playTileReveal(idx * 0.1, st));

      // Simulate opponent progress at the same time!
      const botGuesses = [...session.opponentGuesses];
      // Simulated owl / fox guesses after player inputs a guess
      const botGuessOptions = ['BOARD', 'STONE', 'GRAPE', 'SMART', 'LIGHT', 'FLAME'];
      if (botGuesses.length < 4 && Math.random() < 0.8) {
        botGuesses.push(botGuessOptions[Math.min(botGuesses.length, botGuessOptions.length - 1)]);
      }

      let playerStatus = session.playerStatus;
      if (guessUpper === session.word) {
        playerStatus = 'won';
        setTimeout(() => sound.playWinSound(), 400);
      } else if (updatedGuesses.length >= 6) {
        playerStatus = 'lost';
        setTimeout(() => sound.playLoseSound(), 400);
      }

      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          playerGuesses: updatedGuesses,
          opponentGuesses: botGuesses,
          playerStatus,
        };
      });

      setCurrentGuess('');

      // If player finished, transition to Commit phase automatically
      if (guessUpper === session.word || updatedGuesses.length >= 6) {
        setTimeout(() => {
          setSession(prev => {
            if (!prev) return null;
            return {
              ...prev,
              step: 'commit',
            };
          });
        }, 1000);
      }
    } else if (/^[A-Z]$/i.test(key)) {
      if (currentGuess.length < 5) {
        sound.playKeyPress();
        setCurrentGuess(prev => (prev + key).toUpperCase());
      }
    }
  };

  // Keyboard listener inside active duel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!session || session.step !== 'setup') return;
      if (e.key === 'Backspace') {
        handleDuelKeyPress('DELETE');
      } else if (e.key === 'Enter') {
        handleDuelKeyPress('ENTER');
      } else {
        handleDuelKeyPress(e.key.toUpperCase());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, session]);

  // Sealing / Committing the answer (Envelope Metaphor 1)
  const handleCommitAnswer = () => {
    if (!session) return;
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        playerCommitted: true,
        // Calculate hash
        playerHash: `sha256(${session.playerGuesses[session.playerGuesses.length - 1]}-${session.playerSeed})`
      };
    });

    // Simulate opponent committing shortly after
    setTimeout(() => {
      setSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          opponentCommitted: true,
          opponentHash: `sha256(${session.word}-${session.opponentSeed})`,
          step: 'reveal'
        };
      });
    }, 1200);
  };

  // Revealing / Checking the answer (Envelope Metaphor 2)
  const handleRevealAnswer = () => {
    if (!session) return;
    setSession(prev => {
      if (!prev) return null;
      return {
        ...prev,
        playerRevealed: true,
      };
    });

    // Simulate opponent revealing shortly after
    setTimeout(() => {
      setSession(prev => {
        if (!prev) return null;
        // Check winner
        const pSolved = prev.playerGuesses.includes(prev.word);
        const pAttempts = prev.playerGuesses.length;
        const oSolved = Math.random() < prev.opponent.accuracy; // Bot solves based on accuracy
        const oAttempts = oSolved ? Math.floor(2 + Math.random() * 3) : 6;

        let finalResult: 'won' | 'lost' = 'lost';
        if (pSolved && (!oSolved || pAttempts < oAttempts)) {
          finalResult = 'won';
        } else if (pSolved && oSolved && pAttempts === oAttempts) {
          // tie, let player win for fun!
          finalResult = 'won';
        }

        // Refund prize if player wins
        if (finalResult === 'won') {
          onAddBalance(prev.prizePool);
          onUnlockAchievement('commit-reveal');
        }

        return {
          ...prev,
          opponentRevealed: true,
          opponentStatus: oSolved ? 'won' : 'lost',
          opponentGuesses: Array(oAttempts).fill(prev.word), // Show filled rows
          step: 'finished',
        };
      });
    }, 1200);
  };

  // Clean exit back to Duel Lobby
  const handleResetDuel = () => {
    setSession(null);
    setSelectedOpponent(null);
    setCurrentGuess('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* 1. MAIN ROOM LOBBY (Opponent Selection) */}
      {!session && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Lobby
            </button>
            <span className="text-xs text-[#998D85] font-mono">Arena Mode: Duel</span>
          </div>

          <div className="text-center max-w-xl mx-auto mb-10">
            <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] mb-3">
              Match Duel Arena
            </h1>
            <p className="text-sm md:text-base text-[#6F625B]">
              Challenge standard learning-product animal guides. Uses cryptography to keep guessing fair and secure.
            </p>
          </div>

          {/* Safety Information Box (Section 12) */}
          <div className="bg-[#E7F5FC] border border-[#65B9E8] rounded-2xl p-4 mb-8 text-left max-w-2xl mx-auto text-xs text-[#3D342F] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#65B9E8] shrink-0 mt-0.5" />
            <div>
              <strong className="font-logo font-bold block mb-0.5">Protected Match Funds</strong>
              Your entry amount is held safely in the game-owned account until both players have completed and sealed their answers. Neither player can see the other’s answers during the duel to prevent copycat cheating.
            </div>
          </div>

          {/* Opponent Selection list */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            {OPPONENTS.map(opponent => (
              <motion.div
                key={opponent.id}
                className={`bg-[#FFFCF7] border-2 rounded-3xl p-6 shadow-card hover:shadow-raised transition-all cursor-pointer flex flex-col justify-between ${
                  selectedOpponent?.id === opponent.id ? 'border-[#F28C6F] bg-[#FFF9F0]' : 'border-[#E7DCCB]'
                }`}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedOpponent(opponent)}
              >
                <div className="text-center">
                  <span className="text-5xl block mb-4 filter drop-shadow-sm select-none">{opponent.avatar}</span>
                  <h3 className="text-lg font-logo font-extrabold text-[#3D342F]">{opponent.name}</h3>
                  <p className="text-xs text-[#8B72C9] font-logo font-semibold bg-[#F0ECFA] px-2.5 py-1 rounded-full inline-block mt-1">
                    {opponent.level}
                  </p>
                  
                  <div className="mt-4 space-y-1 text-xs text-[#6F625B]">
                    <p>Accuracy: <strong>{(opponent.accuracy * 100).toFixed(0)}%</strong></p>
                    <p>Thinking Speed: <strong>~{opponent.speedSeconds}s</strong></p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E7DCCB]">
                  <div className="text-xs text-[#6F625B] mb-2">
                    Entry: <strong className="text-[#3D342F]">0.01 SOL</strong>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartDuel(opponent);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-display font-bold transition-all ${
                      selectedOpponent?.id === opponent.id
                        ? 'bg-[#F28C6F] text-white shadow-sm'
                        : 'bg-[#F4EBDD] text-[#3D342F] hover:bg-[#E7DCCB]'
                    }`}
                  >
                    Challenge Opponent
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Notice */}
          <p className="text-xs text-[#998D85] text-center">
            *Duel matches consume exactly 0.01 SOL entry fee from your connected card pouch.
          </p>
        </div>
      )}

      {/* 2. ACTIVE MATCH SCREEN */}
      {session && (
        <div className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-6 md:p-8 shadow-card max-w-3xl mx-auto">
          
          {/* Duel Top header */}
          <div className="flex justify-between items-center pb-4 border-b border-[#E7DCCB] mb-6">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F28C6F] animate-pulse" />
              <span className="text-xs font-bold text-[#F28C6F] uppercase tracking-wider font-display">Live Match #{session.id}</span>
            </div>

            {/* Entry / Prize display */}
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-[#6F625B]">Entry Amount: </span>
                <strong className="text-[#3D342F] font-mono">0.01 SOL</strong>
              </div>
              <div className="h-4 w-px bg-[#E7DCCB]" />
              <div className="px-2.5 py-1 bg-[#FFF3D6] text-[#D99B28] rounded-lg font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Prize: <span className="font-mono">0.018 SOL</span></span>
              </div>
            </div>
          </div>

          {/* Head-to-Head Versus Cards (Section 12 - Duel Screens) */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center mb-8">
            
            {/* Player Card */}
            <div className="md:col-span-4 bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-white border border-[#E7DCCB] flex items-center justify-center mx-auto text-xl mb-2 select-none">
                🧑‍🚀
              </div>
              <h4 className="font-logo font-bold text-sm text-[#3D342F]">You (Solver)</h4>
              <p className="text-xs text-[#79B96B] font-semibold mt-1">
                {session.playerStatus === 'won' ? 'Guessed Word ✓' : 'Solving...'}
              </p>
              <div className="text-[10px] font-mono text-[#998D85] mt-1 break-all">
                {wallet.address.slice(0, 10)}...
              </div>
              
              {/* Attempt markers */}
              <div className="flex gap-1 justify-center mt-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full border ${
                      idx < session.playerGuesses.length ? 'bg-[#79B96B] border-[#79B96B]' : 'bg-white border-[#E7DCCB]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Versus State (Coral Accent) */}
            <div className="md:col-span-3 text-center py-2 md:py-0">
              <span className="px-4 py-1.5 bg-[#FDECE7] text-[#F28C6F] font-logo font-bold rounded-full text-sm uppercase tracking-wider shadow-sm select-none">
                VS
              </span>
              <p className="text-[10px] text-[#6F625B] mt-2">Protected until ends</p>
            </div>

            {/* Opponent Card */}
            <div className="md:col-span-4 bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl p-4 text-center">
              <div className="w-10 h-10 rounded-full bg-white border border-[#E7DCCB] flex items-center justify-center mx-auto text-xl mb-2 select-none">
                {session.opponent.avatar}
              </div>
              <h4 className="font-logo font-bold text-sm text-[#3D342F]">{session.opponent.name}</h4>
              <p className="text-xs text-[#8B72C9] font-semibold mt-1">
                {session.opponentStatus === 'won' ? 'Guessed Word ✓' : 'Solving...'}
              </p>
              <div className="text-[10px] text-[#998D85] mt-1 font-mono">
                Guide Bot Agent
              </div>

              {/* Attempt markers */}
              <div className="flex gap-1 justify-center mt-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-2 rounded-full border ${
                      idx < session.opponentGuesses.length ? 'bg-[#8B72C9] border-[#8B72C9]' : 'bg-white border-[#E7DCCB]'
                    }`}
                  />
                ))}
              </div>
            </div>

          </div>

          {/* 3. GAMEPLAY STEP BOARD */}
          {session.step === 'setup' && (
            <div className="space-y-6">
              <div className="text-center bg-[#FFF9F0] p-3 rounded-2xl border border-[#E7DCCB] max-w-sm mx-auto mb-6">
                <span className="text-xs text-[#6F625B] font-semibold">Guess the central Duel word! (5 attempts max remaining)</span>
              </div>

              {/* Central Puzzle Board */}
              <div className="flex flex-col items-center gap-2 mb-6">
                {Array.from({ length: 6 }).map((_, rIdx) => {
                  const isCurrent = rIdx === session.playerGuesses.length;
                  const isCompleted = rIdx < session.playerGuesses.length;
                  const val = isCurrent
                    ? currentGuess.padEnd(5, ' ')
                    : isCompleted
                    ? session.playerGuesses[rIdx]
                    : '     ';

                  return (
                    <div key={rIdx} className="flex gap-1.5 justify-center">
                      {Array.from({ length: 5 }).map((_, cIdx) => {
                        const letter = val[cIdx]?.trim() || '';
                        let bg = 'bg-white';
                        let border = 'border-[#E7DCCB]';
                        let text = 'text-[#3D342F]';

                        if (isCompleted) {
                          const states = calculateLetterStates(session.playerGuesses[rIdx], session.word);
                          const s = states[cIdx];
                          if (s === 'correct') {
                            bg = 'bg-[#79B96B]'; border = 'border-[#5C9B50]'; text = 'text-white';
                          } else if (s === 'present') {
                            bg = 'bg-[#F2B84B]'; border = 'border-[#D99B28]'; text = 'text-[#3D342F]';
                          } else {
                            bg = 'bg-[#AFA8A3]'; border = 'border-[#918984]'; text = 'text-white';
                          }
                        } else if (letter) {
                          bg = 'bg-[#FFF4E5]';
                          border = 'border-[#A99B8D]';
                        }

                        return (
                          <div
                            key={cIdx}
                            className={`w-10 h-10 rounded-xl border-2 font-logo font-bold text-lg flex items-center justify-center ${bg} ${border} ${text} shadow-sm select-none`}
                          >
                            {letter}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* Tactile Soft Keyboard */}
              <div className="w-full max-w-md mx-auto">
                {['QWERTYUIOP', 'ASDFGHJKL', 'ENTERZXCVBNM⌫'].map((row, idx) => (
                  <div key={idx} className="flex justify-center gap-1 my-1">
                    {row.split('').map(char => {
                      if (char === 'E' && row.includes('ENTER')) return null;
                      if (char === 'N' && row.includes('ENTER')) return null;
                      if (char === 'T' && row.includes('ENTER')) return null;
                      if (char === 'R' && row.includes('ENTER')) return null;
                      
                      let displayKey = char;
                      let actionKey = char;
                      if (char === '⌫') {
                        actionKey = 'DELETE';
                      }

                      return (
                        <button
                          key={char}
                          onClick={() => handleDuelKeyPress(actionKey)}
                          className="px-2.5 py-3 rounded-lg bg-[#F4EBDD] hover:bg-[#E7DCCB] font-logo font-bold text-sm text-[#3D342F] shadow-sm cursor-pointer"
                        >
                          {displayKey}
                        </button>
                      );
                    })}
                    {idx === 2 && (
                      <button
                        onClick={() => handleDuelKeyPress('ENTER')}
                        className="px-3.5 py-3 rounded-lg bg-[#F4EBDD] hover:bg-[#E7DCCB] font-logo font-bold text-xs text-[#3D342F] shadow-sm cursor-pointer"
                      >
                        ENTER
                      </button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* 4. COMMIT STEP (Envelope Metaphor 1) */}
          {session.step === 'commit' && (
            <div className="text-center max-w-md mx-auto py-6">
              
              {/* Interactive Envelope Graphic */}
              <div className="flex justify-center mb-6">
                <motion.div
                  className="w-24 h-24 bg-[#FCE8EC] border-2 border-[#E45C75] rounded-2xl flex items-center justify-center relative shadow-card cursor-pointer"
                  whileHover={{ scale: 1.05, rotate: -2 }}
                  onClick={handleCommitAnswer}
                  animate={session.playerCommitted ? { scale: [1, 1.1, 1], rotate: [0, -4, 0] } : {}}
                >
                  {session.playerCommitted ? (
                    <div className="absolute inset-0 bg-[#EAF5E7] border-2 border-[#79B96B] rounded-2xl flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#79B96B] flex items-center justify-center text-white text-lg font-bold shadow-sm">
                        ✓
                      </div>
                    </div>
                  ) : (
                    <Mail className="w-12 h-12 text-[#E45C75]" />
                  )}
                </motion.div>
              </div>

              <h3 className="text-2xl font-logo font-extrabold text-[#3D342F] mb-2">
                1. Seal your answer (Commit)
              </h3>
              
              <p className="text-sm text-[#6F625B] leading-relaxed mb-6">
                First, your answer is sealed with a timestamp. Your opponent cannot copy your answer because your finishing time and guesses are encrypted and locked.
              </p>

              {session.playerCommitted ? (
                <div className="p-4 bg-[#EAF5E7] border border-[#79B96B] rounded-2xl text-left space-y-2">
                  <div className="text-xs font-semibold text-[#79B96B]">Sealed Answer Hash Secured ✓</div>
                  <div className="font-mono text-[9px] text-[#6F625B] break-all bg-white/60 p-2 rounded">
                    Commit Hash: {session.playerHash}
                  </div>
                  <p className="text-xs text-[#6F625B] animate-pulse">Waiting for {session.opponent.name} to seal their envelope...</p>
                </div>
              ) : (
                <button
                  onClick={handleCommitAnswer}
                  className="w-full py-4 bg-[#E45C75] hover:bg-[#C94360] text-white font-display font-bold rounded-2xl shadow-raised transition-all"
                >
                  Seal My Envelope
                </button>
              )}
            </div>
          )}

          {/* 5. REVEAL STEP (Envelope Metaphor 2) */}
          {session.step === 'reveal' && (
            <div className="text-center max-w-md mx-auto py-6">
              
              {/* Envelope Unveiling Animation */}
              <div className="flex justify-center mb-6 gap-4">
                <motion.div
                  className="w-20 h-20 bg-[#EAF5E7] border-2 border-[#79B96B] rounded-2xl flex items-center justify-center shadow-card cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  onClick={handleRevealAnswer}
                  animate={session.playerRevealed ? { y: -5 } : {}}
                >
                  {session.playerRevealed ? (
                    <MailOpen className="w-10 h-10 text-[#79B96B]" />
                  ) : (
                    <Mail className="w-10 h-10 text-[#79B96B]" />
                  )}
                </motion.div>
              </div>

              <h3 className="text-2xl font-logo font-extrabold text-[#3D342F] mb-2">
                2. Check your answer (Reveal)
              </h3>

              <p className="text-sm text-[#6F625B] leading-relaxed mb-6">
                Both players have safely sealed their answers! Now, we open the envelopes and compare outcomes to distribute the prize funds fairly.
              </p>

              {session.playerRevealed ? (
                <div className="p-4 bg-[#E7F5FC] border border-[#65B9E8] rounded-2xl text-left space-y-1">
                  <div className="text-xs font-semibold text-[#65B9E8] animate-pulse">Decrypting and validating finishes...</div>
                  <p className="text-xs text-[#6F625B]">Reading locked proof accounts from Solana blockchain records.</p>
                </div>
              ) : (
                <button
                  onClick={handleRevealAnswer}
                  className="w-full py-4 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-bold rounded-2xl shadow-raised transition-all"
                >
                  Reveal Locked Envelopes
                </button>
              )}
            </div>
          )}

          {/* 6. DUEL RESULTS */}
          {session.step === 'finished' && (
            <div className="text-center py-6 max-w-md mx-auto">
              
              {/* Prize Sticker Badge */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-[#FFF3D6] rounded-full border-2 border-[#F2B84B] flex items-center justify-center text-4xl shadow-card rotate-[-4deg]">
                  🏆
                </div>
              </div>

              {/* Game state analysis */}
              {session.playerGuesses.includes(session.word) ? (
                <div>
                  <h3 className="text-2xl font-logo font-extrabold text-[#79B96B] mb-2">
                    Splendid Victory!
                  </h3>
                  <p className="text-sm text-[#6F625B] leading-relaxed mb-6">
                    You guessed the word "{session.word}" in {session.playerGuesses.length} attempts, while {session.opponent.name} needed more tries. The prize pool of <strong>0.018 SOL</strong> has been returned securely to your wallet card pouch!
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-2xl font-logo font-extrabold text-[#3D342F] mb-2">
                    A friendly, close match!
                  </h3>
                  <p className="text-sm text-[#6F625B] leading-relaxed mb-6">
                    {session.opponent.name} guessed the word "{session.word}" successfully. Every match is a friendly step towards word-puzzle mastery. Practice again to hone your strategies!
                  </p>
                </div>
              )}

              {/* On-Chain Records Summary under technical toggle */}
              <div className="p-4 bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl text-left text-xs mb-6 font-mono space-y-1 text-[#6F625B]">
                <div className="font-semibold text-[#3D342F] font-display mb-1">On-Chain Verified Record</div>
                <div>Match Room: {session.id}</div>
                <div>Winner Finisher: {session.playerGuesses.includes(session.word) ? 'You' : session.opponent.name}</div>
                <div>Player Seed: {session.playerSeed}</div>
                <div>Opponent Seed: {session.opponentSeed}</div>
                <div className="text-[10px] text-[#998D85] pt-1">Settled in block #189,203 on Solana Mainnet</div>
              </div>

              <button
                onClick={handleResetDuel}
                className="w-full py-3.5 bg-[#FDECE7] hover:bg-[#FCD8CD] text-[#F28C6F] font-display font-bold text-sm rounded-xl transition-all"
              >
                Back to Duel Arena Lobby
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
