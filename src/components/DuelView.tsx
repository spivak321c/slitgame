import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ArrowLeft, User, Users, Check, Delete, Plus, Coins, Swords } from 'lucide-react';
import { ScreenType, Opponent, DuelSession, OPPONENTS, calculateLetterStates } from '../types';
import { sound } from '../utils/audio';
import DuelResultSheet from './DuelResultSheet';
import CreateDuelModal from './CreateDuelModal';
import { DuelRoom, addDuelRoom, OPEN_DUEL_ROOMS } from '../data/duelRooms';

const DUEL_WORD_LENGTH = 5;
const DUEL_MAX_ATTEMPTS = 6;

const DUEL_WORDS = ['LIGHT', 'FLAME', 'STONE', 'BOARD', 'SMART', 'GRAPE', 'CORAL', 'FRESH', 'WORLD', 'MATCH'];

// Bot solve attempts by accuracy: higher accuracy → solves faster
const botSolveTries = (opponent: Opponent) => Math.max(3, Math.ceil(opponent.accuracy * DUEL_MAX_ATTEMPTS));

interface DuelViewProps {
  onNavigate: (screen: ScreenType) => void;
  coins: number;
  onDeductCoins: (amount: number, desc: string) => void;
  onDuelFinished: (won: boolean, prize: number) => void;
  joinRoom?: DuelRoom | null;
  onJoinRoomHandled?: () => void;
}

export default function DuelView({
  onNavigate,
  coins,
  onDeductCoins,
  onDuelFinished,
  joinRoom,
  onJoinRoomHandled,
}: DuelViewProps) {
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [session, setSession] = useState<DuelSession | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [shake, setShake] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialStake, setCreateInitialStake] = useState<number | null>(null);
  const [stakeFilter, setStakeFilter] = useState<number | 'all'>('all');
  const [openRooms, setOpenRooms] = useState<DuelRoom[]>(OPEN_DUEL_ROOMS);
  const [botThinking, setBotThinking] = useState(false);
  const [insufficientCoins, setInsufficientCoins] = useState<number | null>(null);

  const filteredRooms = openRooms.filter(room => {
    if (stakeFilter === 'all') return true;
    return room.stake === stakeFilter;
  });

  const openCreateModal = (stake: number | null = null) => {
    sound.playKeyPress();
    setCreateInitialStake(stake);
    setCreateModalOpen(true);
  };

  const handleRoomCreated = (room: DuelRoom) => {
    addDuelRoom(room);
    setOpenRooms([...OPEN_DUEL_ROOMS]);
    sound.playRewardSound();
  };

  // Initialize a challenge match
  const handleStartDuel = (opponent: Opponent, entryFee = 20) => {
    if (coins < entryFee) {
      setInsufficientCoins(entryFee);
      sound.playShakeSound();
      return;
    }

    sound.playRewardSound();
    onDeductCoins(entryFee, `Duel entry vs ${opponent.name}`);

    const chosenWord = DUEL_WORDS[Math.floor(Math.random() * DUEL_WORDS.length)];

    setSession({
      id: Math.floor(1000 + Math.random() * 9000).toString(),
      opponent,
      entryFee,
      prizePool: entryFee * 2,
      playerGuesses: [],
      opponentGuesses: [],
      playerCurrentGuess: '',
      opponentCurrentGuess: '',
      playerStatus: 'playing',
      opponentStatus: 'playing',
      word: chosenWord,
      wordLength: DUEL_WORD_LENGTH,
      step: 'setup',
    });
  };

  // Bot takes a turn: tries to make progress toward the answer
  const botTakeTurn = useCallback(() => {
    if (!session) return;
    setBotThinking(true);

    const botTries = botSolveTries(session.opponent);
    const nextBotCount = session.opponentGuesses.length + 1;
    const solved = nextBotCount >= botTries;

    setTimeout(() => {
      setSession(prev => {
        if (!prev) return null;

        const botGuessPool = DUEL_WORDS.filter(w => w !== prev.word).slice(0, 4);
        const botGuess = solved ? prev.word : botGuessPool[nextBotCount % botGuessPool.length];

        const opponentGuesses = [...prev.opponentGuesses, botGuess];
        const opponentStatus = solved ? 'won' : prev.opponentStatus;
        setBotThinking(false);

        // reveal sounds for the bot row
        const states = calculateLetterStates(botGuess, prev.word);
        states.forEach((st, idx) => sound.playTileReveal(idx * 0.08, st));

        return { ...prev, opponentGuesses, opponentStatus };
      });
    }, 900);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const finishDuel = (next: DuelSession) => {
    const pWon = next.playerStatus === 'won';
    const oWon = next.opponentStatus === 'won';
    const pAttempts = next.playerGuesses.length;
    const oAttempts = next.opponentGuesses.length;

    let result: 'won' | 'lost';
    if (pWon && (!oWon || pAttempts <= oAttempts)) {
      result = 'won'; // friendly tie → player wins
    } else if (oWon && !pWon) {
      result = 'lost';
    } else if (!pWon && !oWon) {
      result = pAttempts < oAttempts ? 'won' : 'lost';
    } else {
      result = 'lost';
    }

    setTimeout(() => {
      setSession(prev =>
        prev
          ? {
              ...prev,
              playerStatus: result === 'won' ? 'won' : 'lost',
              opponentStatus: result === 'won' ? 'lost' : 'won',
              step: 'finished',
            }
          : null
      );
      if (result === 'won') {
        sound.playWinSound();
        onDuelFinished(true, next.prizePool);
      } else {
        sound.playLoseSound();
        onDuelFinished(false, 0);
      }
    }, 600);
  };

  // Keyboard Handlers inside the Duel
  const handleDuelKeyPress = (key: string) => {
    if (!session || session.step !== 'setup' || botThinking) return;

    if (key === 'DELETE' || key === 'BACKSPACE') {
      sound.playKeyDelete();
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      if (currentGuess.length < DUEL_WORD_LENGTH) {
        sound.playShakeSound();
        setShake(true);
        setTimeout(() => setShake(false), 400);
        return;
      }

      sound.playKeyEnter();
      const guessUpper = currentGuess.toUpperCase();
      const updatedGuesses = [...(session.playerGuesses ?? []), guessUpper];

      const states = calculateLetterStates(guessUpper, session.word);
      states.forEach((st, idx) => sound.playTileReveal(idx * 0.1, st));

      const playerWon = guessUpper === session.word;
      const playerLost = !playerWon && updatedGuesses.length >= DUEL_MAX_ATTEMPTS;

      const nextSession: DuelSession = {
        ...session,
        playerGuesses: updatedGuesses,
        playerStatus: playerWon ? 'won' : playerLost ? 'lost' : 'playing',
      };
      setSession(nextSession);
      setCurrentGuess('');

      const playerDone = playerWon || playerLost;
      const botDone = nextSession.opponentStatus === 'won' || nextSession.opponentGuesses.length >= DUEL_MAX_ATTEMPTS;

      if (playerDone && botDone) {
        finishDuel(nextSession);
      } else if (playerDone && !botDone) {
        botTakeTurn();
      } else if (!playerDone && !botDone) {
        botTakeTurn();
      } else {
        finishDuel(nextSession);
      }
    } else if (/^[A-Z]$/i.test(key)) {
      if (currentGuess.length < DUEL_WORD_LENGTH) {
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
  }, [currentGuess, session, botThinking]);

  // Auto-join a shared room from the dashboard live-rooms card
  useEffect(() => {
    if (joinRoom && !session) {
      handleStartDuel(joinRoom.host, joinRoom.stake);
      onJoinRoomHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinRoom]);

  // Clean exit back to Duel Lobby
  const handleResetDuel = () => {
    setSession(null);
    setSelectedOpponent(null);
    setCurrentGuess('');
  };

  const renderWordRow = (guess: string, isCompleted: boolean, isBot: boolean) => {
    const letters = guess.padEnd(DUEL_WORD_LENGTH, ' ').split('');
    const states = isCompleted ? calculateLetterStates(guess, session?.word ?? '') : null;

    return (
      <div className="flex gap-1 sm:gap-1.5 justify-center">
        {letters.map((letter, cIdx) => {
          let bg = 'bg-white';
          let border = 'border-[#E7DCCB]';
          let text = 'text-[#3D342F]';

          if (isCompleted && states) {
            const s = states[cIdx];
            if (s === 'correct') {
              bg = 'bg-[#79B96B]'; border = 'border-[#5C9B50]'; text = 'text-white';
            } else if (s === 'present') {
              bg = 'bg-[#F2B84B]'; border = 'border-[#D99B28]'; text = 'text-[#3D342F]';
            } else {
              bg = 'bg-[#AFA8A3]'; border = 'border-[#918984]'; text = 'text-white';
            }
          } else if (letter.trim() && !isBot) {
            bg = 'bg-[#FFF4E5]';
            border = 'border-[#A99B8D]';
          }

          return (
            <div
              key={cIdx}
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl border-2 font-logo font-bold text-base sm:text-lg flex items-center justify-center ${bg} ${border} ${text} shadow-xs select-none`}
            >
              {letter.trim()}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      
      {/* 1. MAIN ROOM LOBBY (Opponent Selection) */}
      {!session && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Lobby
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#998D85] font-mono">Arena Mode: Duel</span>
              <motion.button
                onClick={() => openCreateModal()}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_2px_0_#AF324B] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                Create a duel
              </motion.button>
            </div>
          </div>

          {insufficientCoins !== null && (
            <div className="max-w-2xl mx-auto mb-6 p-3.5 bg-[#FCE8EC] border border-[#E45C75]/40 rounded-2xl flex items-start gap-3">
              <Coins className="w-5 h-5 text-[#E45C75] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-xs text-[#3D342F] font-display">
                <strong className="font-logo font-bold">Not enough coins.</strong>{' '}
                You need <strong className="font-mono inline-flex items-center gap-1">{insufficientCoins}<Coins className="w-3 h-3 text-[#F2B84B]" /></strong> to enter this duel — your pouch has <strong className="font-mono inline-flex items-center gap-1">{coins}<Coins className="w-3 h-3 text-[#F2B84B]" /></strong>. Solve a few puzzles to top up, or pick a lower stake.
              </div>
              <button
                type="button"
                onClick={() => setInsufficientCoins(null)}
                className="px-2 py-1 text-[10px] font-display font-extrabold text-[#E45C75] hover:bg-[#FCE8EC] rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss"
              >
                OK
              </button>
            </div>
          )}

          <div className="text-center max-w-xl mx-auto mb-10">
            <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] mb-3">
              Match Duel Arena
            </h1>
            <p className="text-sm md:text-base text-[#6F625B]">
              Challenge our clever puzzle guides head-to-head on the same word. Winner takes the coin pot — pure wits, no luck.
            </p>
          </div>

          {/* Coin Pot Info Box */}
          <div className="bg-[#FFF3D6] border border-[#F2B84B] rounded-2xl p-4 mb-8 text-left max-w-2xl mx-auto text-xs text-[#3D342F] flex items-start gap-3">
            <Coins className="w-5 h-5 text-[#D99B28] shrink-0 mt-0.5" />
            <div>
              <strong className="font-logo font-bold block mb-0.5">Coin Pot Duels</strong>
              Your entry coins are added to the pot, doubled by your opponent. The faster solver takes it all home to their pouch — coins are purely for fun.
            </div>
          </div>

          {/* Stake-Filtered Open Rooms Lobby */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center gap-1.5 mb-3 text-[#3D342F]">
              <Users className="w-4 h-4 text-[#F28C6F]" />
              <h2 className="font-logo font-extrabold text-sm">Open staked rooms</h2>
              <span className="text-[10.5px] font-mono text-[#998D85] ml-auto">
                {openRooms.filter(r => !r.isFull).length} waiting
              </span>
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-1.5 flex-wrap mb-3">
              <span className="text-[11px] text-[#998D85] font-bold mr-1">Filter stakes:</span>
              {(['all', 20, 50, 100, 200, 500] as const).map(filterVal => (
                <button
                  key={filterVal.toString()}
                  onClick={() => setStakeFilter(filterVal)}
                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-display font-bold transition-all cursor-pointer ${
                    stakeFilter === filterVal
                      ? 'bg-[#E45C75] text-white border-[#E45C75] shadow-[0_2px_0_#AF324B]'
                      : 'bg-[#FFFCF7] text-[#3D342F] border-[#E7DCCB] hover:bg-[#FAF4EA]'
                  }`}
                >
                  {filterVal === 'all' ? 'All rooms' : <span className="inline-flex items-center gap-1">{filterVal}<Coins className="w-3 h-3 text-[#F2B84B]" /></span>}
                </button>
              ))}
            </div>

            {/* Room rows */}
            {filteredRooms.length === 0 ? (
              <div className="p-6 bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl text-center space-y-3">
                <Users className="w-7 h-7 text-[#998D85] mx-auto opacity-50" />
                <p className="text-xs text-[#6F625B]">
                  No open duel rooms match <strong className="text-[#3D342F]">{stakeFilter === 'all' ? 'this filter' : <span className="inline-flex items-center gap-1">{stakeFilter}<Coins className="w-3 h-3 text-[#F2B84B]" /></span>}</strong>…
                </p>
                <button
                  onClick={() => openCreateModal(stakeFilter === 'all' ? null : stakeFilter)}
                  className="px-4 py-2 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_2px_0_#AF324B] transition-all cursor-pointer"
                >
                  {stakeFilter === 'all' ? '+ Create room' : <>+ Create <span className="inline-flex items-center gap-1">{stakeFilter}<Coins className="w-3 h-3 text-[#F2B84B]" /></span> room</>}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRooms.map(room => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-3 bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl px-4 py-3 hover:border-[#F28C6F]/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-[#FAF4EA] border border-[#EADFCB] grid place-items-center text-lg shrink-0">
                        {room.host.avatar}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-logo font-extrabold text-xs text-[#3D342F] truncate">
                            {room.handle}
                          </span>
                          {room.isYours && (
                            <span className="bg-[#FFF3D6] text-[#B8860B] text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-[#F2C974]">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[10.5px] font-semibold text-[#79B96B]">
                          <span className="inline-flex items-center gap-1">{room.stake}<Coins className="w-3 h-3 text-[#F2B84B]" /></span> · {room.minutes} min
                        </div>
                        <div className="text-[10px] text-[#998D85]">
                          {room.slices}/{room.sliceTotal} slices
                        </div>
                      </div>
                    </div>
                    {room.isFull ? (
                      <button
                        disabled
                        className="px-4 py-1.5 bg-[#F4EBDD] text-[#A69485] font-display font-extrabold text-[11px] rounded-full opacity-60 cursor-not-allowed"
                      >
                        Full
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartDuel(room.host, room.stake)}
                        className="px-4 py-1.5 bg-[#FDECE7] hover:bg-[#FCD8CD] border border-[#FADCD5] text-[#D96B4C] font-display font-extrabold text-[11px] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {room.isYours ? 'Enter Arena' : 'Join'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
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
                    Entry: <strong className="text-[#3D342F] inline-flex items-center gap-1">20<Coins className="w-3 h-3 text-[#F2B84B]" /></strong> · Pot: <span className="inline-flex items-center gap-1">40<Coins className="w-3 h-3 text-[#F2B84B]" /></span>
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
            *Duel matches consume exactly <span className="inline-flex items-center gap-1">20<Coins className="w-3 h-3 text-[#F2B84B]" /></span> entry fee from your coin pouch. Win to double it!
          </p>
        </div>
      )}

      {/* 2. ACTIVE MATCH SCREEN */}
      {session && (
        <div className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-5 md:p-8 shadow-card max-w-5xl mx-auto">
          
          {/* Duel Top header */}
          <div className="flex justify-between items-center pb-4 border-b border-[#E7DCCB] mb-6 gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F28C6F] animate-pulse" />
              <span className="text-xs font-bold text-[#F28C6F] uppercase tracking-wider font-display">Live Match #{session.id}</span>
            </div>

            {/* Entry / Prize display */}
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-[#6F625B]">Entry: </span>
                <strong className="text-[#3D342F] font-mono inline-flex items-center gap-1">{session.entryFee}<Coins className="w-3 h-3 text-[#F2B84B]" /></strong>
              </div>
              <div className="h-4 w-px bg-[#E7DCCB]" />
              <div className="px-2.5 py-1 bg-[#FFF3D6] text-[#D99B28] rounded-lg font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Pot: <span className="font-mono">{session.prizePool}</span></span>
              </div>
            </div>
          </div>

          {/* Two-column match layout: boards (left) + live stats (right) */}
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-6">

            {/* MAIN COLUMN — gameplay */}
            <div className="lg:col-span-8 min-w-0">

          {/* 3. GAMEPLAY STEP BOARD */}
          {session.step === 'setup' && (
            <div className="space-y-6">

              {/* You vs Opponent boards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-logo font-extrabold text-[#79B96B] uppercase tracking-wider">
                    <User className="w-3.5 h-3.5" /> You
                  </div>
                  {Array.from({ length: DUEL_MAX_ATTEMPTS }).map((_, rIdx) => {
                    const isCurrent = rIdx === session.playerGuesses.length;
                    const isCompleted = rIdx < session.playerGuesses.length;
                    const val = isCurrent
                      ? currentGuess.padEnd(DUEL_WORD_LENGTH, ' ')
                      : isCompleted
                      ? session.playerGuesses[rIdx]
                      : '     ';
                    return renderWordRow(val, isCompleted, false);
                  })}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-[11px] font-logo font-extrabold text-[#8B72C9] uppercase tracking-wider">
                    {session.opponent.avatar} {session.opponent.name}
                    {botThinking && <span className="w-2 h-2 rounded-full bg-[#8B72C9] animate-pulse" />}
                  </div>
                  {Array.from({ length: DUEL_MAX_ATTEMPTS }).map((_, rIdx) => {
                    const isCompleted = rIdx < session.opponentGuesses.length;
                    const val = isCompleted ? session.opponentGuesses[rIdx] : '     ';
                    return (
                      <motion.div
                        key={rIdx}
                        initial={isCompleted ? { opacity: 0, y: -8, scale: 0.96 } : false}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        {renderWordRow(val, isCompleted, true)}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Tactile Soft Keyboard (Mobile-optimized flex layout) */}
              <div className={`w-full max-w-md mx-auto px-1 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
                {[
                  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
                  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
                  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE']
                ].map((row, rIdx) => (
                  <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5 my-1">
                    {row.map(key => {
                      const isWide = key === 'ENTER' || key === 'DELETE';
                      return (
                        <button
                          key={key}
                          onClick={() => handleDuelKeyPress(key)}
                          disabled={botThinking}
                          className={`${
                            isWide
                              ? 'px-2 sm:px-3 h-11 sm:h-12 text-[10px] sm:text-xs shrink-0 font-extrabold'
                              : 'flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm md:text-base font-bold'
                          } font-logo rounded-lg bg-[#F4EBDD] active:bg-[#E7DCCB] hover:bg-[#E7DCCB] text-[#3D342F] shadow-xs cursor-pointer active:scale-95 transition-all touch-manipulation flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {key === 'DELETE' ? <Delete className="w-4 h-4" /> : key}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* 4. DUEL RESULTS */}
          {session.step === 'finished' && (
            <div className="py-6 max-w-md mx-auto">
              <DuelResultSheet
                word={session.word}
                attempts={session.playerGuesses.length}
                won={session.playerStatus === 'won'}
                prizePool={session.prizePool}
                entryFee={session.entryFee}
                opponentName={session.opponent.name}
                opponentAvatar={session.opponent.avatar}
                continueLabel="Back to Duel Arena Lobby"
                onContinue={handleResetDuel}
              />
            </div>
          )}

            </div>{/* end MAIN COLUMN */}

            {/* LIVE VS SIDEBAR — compact strip on mobile, stacked sticky rail on desktop */}
            <aside className="order-first lg:order-none lg:col-span-3 min-w-0 sticky top-16 lg:top-24 z-20 self-start">
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-3">

                {/* You cell */}
                <div className="bg-[#FFF9F0] border border-[#E7DCCB] rounded-xl lg:rounded-2xl p-2.5 lg:p-3">
                  <div className="flex items-center gap-2 lg:gap-2.5">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 shrink-0 rounded-full bg-white border border-[#E7DCCB] flex items-center justify-center select-none text-[#6F625B]">
                      <User className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="font-logo font-bold text-[10px] lg:text-xs text-[#3D342F] truncate">You (Solver)</h4>
                        <span className={`px-1 py-0.5 rounded-full text-[8px] lg:text-[9px] font-bold uppercase tracking-wide shrink-0 ${session.playerStatus === 'won' ? 'bg-[#E3F2DD] text-[#5C9E4E]' : 'bg-[#F2ECE4] text-[#998D85]'}`}>
                          {session.playerStatus === 'won' ? '✓ Won' : 'Playing'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5 mt-0.5">
                        <p className={`text-[9px] lg:text-[10px] font-semibold truncate ${session.playerStatus === 'won' ? 'text-[#79B96B]' : 'text-[#6F625B]'}`}>
                          {session.step === 'finished' && session.playerStatus === 'lost' ? 'Out of keys' : session.playerStatus === 'won' ? 'Guessed the word' : 'Solving...'}
                        </p>
                        <span className="text-[8px] lg:text-[9px] font-mono text-[#998D85] shrink-0">{Math.max(0, DUEL_MAX_ATTEMPTS - session.playerGuesses.length)} keys</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center justify-between mt-2 pt-2 border-t border-[#F0E7D8]">
                    <div className="flex gap-1">
                      {Array.from({ length: DUEL_MAX_ATTEMPTS }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 w-2 rounded-full border ${
                            idx < session.playerGuesses.length ? 'bg-[#79B96B] border-[#79B96B]' : 'bg-white border-[#E7DCCB]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[#998D85] inline-flex items-center gap-0.5">{session.entryFee}<Coins className="w-2.5 h-2.5 text-[#F2B84B]" /></span>
                  </div>
                </div>

                {/* Opponent cell */}
                <div className="bg-[#FFF9F0] border border-[#E7DCCB] rounded-xl lg:rounded-2xl p-2.5 lg:p-3">
                  <div className="flex items-center gap-2 lg:gap-2.5">
                    <div className="w-6 h-6 lg:w-8 lg:h-8 shrink-0 rounded-full bg-white border border-[#E7DCCB] flex items-center justify-center text-sm lg:text-base select-none">
                      {session.opponent.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="font-logo font-bold text-[10px] lg:text-xs text-[#3D342F] truncate">{session.opponent.name}</h4>
                        <span className={`px-1 py-0.5 rounded-full text-[8px] lg:text-[9px] font-bold uppercase tracking-wide shrink-0 ${session.opponentStatus === 'won' ? 'bg-[#EDE7F9] text-[#8B72C9]' : 'bg-[#F2ECE4] text-[#998D85]'}`}>
                          {session.opponentStatus === 'won' ? '✓ Won' : 'Playing'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1.5 mt-0.5">
                        <p className={`text-[9px] lg:text-[10px] font-semibold truncate ${session.opponentStatus === 'won' ? 'text-[#8B72C9]' : 'text-[#6F625B]'}`}>
                          {botThinking ? 'Thinking...' : session.opponentStatus === 'won' ? 'Guessed the word' : session.step === 'finished' ? 'Out of keys' : 'Playing...'}
                        </p>
                        <span className="text-[8px] lg:text-[9px] font-mono text-[#998D85] shrink-0">{session.opponentGuesses.length}/{DUEL_MAX_ATTEMPTS}</span>
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center justify-between mt-2 pt-2 border-t border-[#F0E7D8]">
                    <div className="flex gap-1">
                      {Array.from({ length: DUEL_MAX_ATTEMPTS }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-2 w-2 rounded-full border ${
                            idx < session.opponentGuesses.length ? 'bg-[#8B72C9] border-[#8B72C9]' : 'bg-white border-[#E7DCCB]'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-[#998D85] inline-flex items-center gap-0.5">{session.prizePool}<Coins className="w-2.5 h-2.5 text-[#F2B84B]" /> pot</span>
                  </div>
                </div>
              </div>

                {/* Live activity feed (desktop only) */}
                <div className="hidden lg:block bg-white border border-[#E7DCCB] rounded-2xl p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#F28C6F] animate-pulse" />
                    <span className="text-[10px] font-bold text-[#F28C6F] uppercase tracking-wider font-display">Live Activity</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-[#6F625B]">
                    {session.playerGuesses.length > 0 && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#79B96B]" />
                        <span>You played <strong className="font-mono">{session.playerGuesses.length}</strong> attempt{session.playerGuesses.length > 1 ? 's' : ''}</span>
                      </li>
                    )}
                    {session.opponentGuesses.length > 0 && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B72C9]" />
                        <span>{session.opponent.name} played <strong className="font-mono">{session.opponentGuesses.length}</strong> attempt{session.opponentGuesses.length > 1 ? 's' : ''}</span>
                      </li>
                    )}
                    {botThinking && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F2B84B]" />
                        <span>{session.opponent.name} is thinking...</span>
                      </li>
                    )}
                    {session.step === 'setup' && !botThinking && (
                      <li className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F2B84B]" />
                        <span>Your turn — type a guess</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2 pt-1 border-t border-[#F0E7D8]">
                      <Coins className="w-3 h-3 text-[#F2B84B]" />
                      <span>Winner takes <strong className="font-mono inline-flex items-center gap-1">{session.prizePool}<Coins className="w-3 h-3 text-[#F2B84B]" /></strong> + XP</span>
                    </li>
                  </ul>
                </div>

            </aside>

          </div>{/* end two-column grid */}

        </div>
      )}

      <CreateDuelModal
        isOpen={createModalOpen}
        initialStake={createInitialStake}
        onClose={() => setCreateModalOpen(false)}
        onCreateRoom={handleRoomCreated}
      />

    </div>
  );
}