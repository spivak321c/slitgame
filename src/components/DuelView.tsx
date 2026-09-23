import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User,
  Users,
  Delete,
  Plus,
  Coins,
  Swords,
  Copy,
  Check,
  Link as LinkIcon,
  Share2,
  LogOut,
  WifiOff,
  Timer,
  Zap,
} from 'lucide-react';
import { ScreenType, DIFFICULTIES, type Difficulty } from '../types';
import { sound } from '../utils/audio';
import { useGameStore, useSessionStore } from '../store/gameStore';
import { isSupabaseConfigured } from '../lib/supabase';
import { isEnglishWord, loadWordBank } from '../lib/dictionary';
import {
  createDuel,
  joinDuel,
  leaveDuel,
  claimForfeit,
  getDuelState,
  submitDuelGuess,
  subscribeDuel,
  DuelError,
  type DuelSubscription,
} from '../lib/duelService';
import {
  type DuelSnapshot,
  type DuelPlayerState,
  type DuelDifficulty,
  type DuelOutcome,
  duelRewards,
  opponentIsStale,
} from '../lib/duelTypes';
import DuelResultSheet from './DuelResultSheet';
import CreateDuelModal from './CreateDuelModal';
import { useBoardFit } from '../hooks/useBoardFit';

type DuelPhase = 'lobby' | 'waiting' | 'live' | 'result';

interface DuelViewProps {
  onNavigate: (screen: ScreenType) => void;
  onDuelFinished: (outcome: DuelOutcome) => void;
  joinCode?: string | null;
  onJoinCodeHandled?: () => void;
  /** Phase 4 — auto-create a duel at this difficulty (Recent Rivals rematch). */
  autoCreateDifficulty?: Difficulty | null;
  onAutoCreateHandled?: () => void;
  onLiveChange?: (live: boolean) => void;
}

const fmtClock = (totalSec: number) =>
  `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;

const fmtMs = (ms: number | null) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`);

export default function DuelView({
  onNavigate,
  onDuelFinished,
  joinCode,
  onJoinCodeHandled,
  autoCreateDifficulty,
  onAutoCreateHandled,
  onLiveChange,
}: DuelViewProps) {
  // ── Stores ──────────────────────────────────────────────────────────
  const profile = useGameStore(s => s.profile);
  const activeDuelId = useGameStore(s => s.activeDuelId);
  const setActiveDuel = useGameStore(s => s.setActiveDuel);
  const playerId = useSessionStore(s => s.playerId);
  const authReady = useSessionStore(s => s.authReady);

  // ── Local state ─────────────────────────────────────────────────────
  const [phase, setPhase] = useState<DuelPhase>('lobby');
  const [snapshot, setSnapshot] = useState<DuelSnapshot | null>(null);
  const [currentGuess, setCurrentGuess] = useState('');
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [busy, setBusy] = useState<'creating' | 'joining' | null>(null);
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [confirmForfeit, setConfirmForfeit] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  const duel = snapshot?.duel ?? null;
  const me: DuelPlayerState | null =
    snapshot?.players.find(p => p.player_id === snapshot.myPlayerId) ?? null;
  const opponent: DuelPlayerState | null =
    snapshot?.players.find(p => p.player_id !== snapshot.myPlayerId) ?? null;

  const online = isSupabaseConfigured && (!authReady || playerId !== null);
  const myTurnActive = phase === 'live' && me?.status === 'playing' && !submitting;

  // Tile size that makes the live board fit the available height — no
  // internal scroll, exactly like wordle.global.
  const { ref: liveBoardRef, size: liveTile } = useBoardFit(
    duel?.attempts_limit ?? 6,
    duel?.word_length ?? 5,
    8,
    78
  );

  const isLiveMatch = phase === 'live' && Boolean(duel);
  useEffect(() => {
    onLiveChange?.(isLiveMatch);
    return () => onLiveChange?.(false);
  }, [isLiveMatch, onLiveChange]);

  // ── Snapshot application ────────────────────────────────────────────
  const applySnapshot = useCallback(
    (snap: DuelSnapshot) => {
      setSnapshot(snap);
      const st = snap.duel.status;
      if (st === 'cancelled') {
        setActiveDuel(null);
        setSnapshot(null);
        setPhase('lobby');
        return;
      }
      setPhase(st === 'waiting' ? 'waiting' : st === 'active' ? 'live' : 'result');
    },
    [setActiveDuel]
  );

  // ── Restore after refresh / handle ?duel=CODE share links ──────────
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    (async () => {
      if (activeDuelId) {
        try {
          const snap = await getDuelState(activeDuelId);
          if (cancelled) return;
          if (snap) {
            applySnapshot(snap);
            return;
          }
        } catch {
          /* network hiccup — fall through to lobby */
        }
        if (!cancelled) setActiveDuel(null);
      }
      if (joinCode && !cancelled) {
        onJoinCodeHandled?.();
        // Auto-join straight from the share link — a friend tapping
        // ?duel=CODE lands in the duel with zero extra steps. On failure
        // (finished, full, offline) the code stays pre-filled with the
        // error shown so they can retry from the lobby.
        setBusy('joining');
        try {
          const { duelId } = await joinDuel(
            joinCode.toUpperCase(),
            profile.username,
            profile.avatar
          );
          const snap = await getDuelState(duelId);
          if (cancelled) return;
          setActiveDuel(duelId);
          if (snap) applySnapshot(snap);
          sound.playRewardSound();
        } catch (err) {
          if (!cancelled) showError(err);
        } finally {
          if (!cancelled) setBusy(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady]);

  // ── Phase 4: auto-create from Recent Rivals (one-tap rematch) ───────
  // Fires once per challenge: waits for the session handshake, creates a
  // duel at the requested difficulty, and lands in the waiting room.
  const autoCreateBusyRef = useRef(false);
  const validatingRef = useRef(false);
  useEffect(() => {
    if (!authReady || !autoCreateDifficulty || autoCreateBusyRef.current) return;
    autoCreateBusyRef.current = true;
    (async () => {
      try {
        const { duelId } = await createDuel(
          autoCreateDifficulty,
          profile.username,
          profile.avatar
        );
        const snap = await getDuelState(duelId);
        setActiveDuel(duelId);
        if (snap) applySnapshot(snap);
        sound.playRewardSound();
      } catch (err) {
        showError(err);
      } finally {
        autoCreateBusyRef.current = false;
        onAutoCreateHandled?.();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, autoCreateDifficulty]);

  // ── Realtime subscription while a duel is live/waiting ─────────────
  const duelStatus = duel?.status;
  useEffect(() => {
    if (!activeDuelId || !duelStatus || (duelStatus !== 'waiting' && duelStatus !== 'active')) {
      return;
    }
    const sub: DuelSubscription = subscribeDuel(
      activeDuelId,
      applySnapshot,
      err => setError(err.message)
    );
    return () => sub.unsubscribe();
  }, [activeDuelId, duelStatus, applySnapshot]);

  // ── Timer tick ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'live') return;
    const t = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const elapsedSec = duel?.started_at
    ? Math.max(0, Math.floor((nowTick - new Date(duel.started_at).getTime()) / 1000))
    : 0;

  // ── Fire the outcome exactly once per duel ──────────────────────────
  const settledRef = useRef<string | null>(null);
  useEffect(() => {
    if (!snapshot || snapshot.duel.status !== 'finished') return;
    if (settledRef.current === snapshot.duel.id) return;
    settledRef.current = snapshot.duel.id;

    const won = !snapshot.duel.is_draw && snapshot.duel.winner_player_id === snapshot.myPlayerId;
    const draw = snapshot.duel.is_draw;
    const outcome: DuelOutcome = {
      duelId: snapshot.duel.id,
      won,
      draw,
      word: snapshot.duel.revealed_word ?? '?????',
      attempts: me?.attempts ?? 0,
      timeMs: me?.time_ms ?? null,
      rewards: duelRewards(snapshot.duel.difficulty, draw ? 'draw' : won ? 'won' : 'lost'),
    };
    onDuelFinished(outcome);
    if (won) sound.playWinSound();
    else if (draw) sound.playRewardSound();
    else sound.playLoseSound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot]);

  // ── Best-effort forfeit if the tab is closed mid-match ──────────────
  useEffect(() => {
    if (phase !== 'live' || !activeDuelId) return;
    const onUnload = () => {
      leaveDuel(activeDuelId).catch(() => undefined);
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [phase, activeDuelId]);

  // ── Actions ─────────────────────────────────────────────────────────
  const showError = (err: unknown) => {
    const msg = err instanceof DuelError ? err.message : 'Something went wrong — try again.';
    setError(msg);
    sound.playShakeSound();
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleCreate = async (difficulty: DuelDifficulty) => {
    if (busy) return;
    setBusy('creating');
    setError(null);
    try {
      const { duelId } = await createDuel(difficulty, profile.username, profile.avatar);
      const snap = await getDuelState(duelId);
      setActiveDuel(duelId);
      if (snap) applySnapshot(snap);
      sound.playRewardSound();
      setCreateModalOpen(false);
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  };

  const handleJoin = async () => {
    const code = joinInput.trim().toUpperCase();
    if (code.length !== 6 || busy) return;
    setBusy('joining');
    setError(null);
    try {
      const { duelId } = await joinDuel(code, profile.username, profile.avatar);
      const snap = await getDuelState(duelId);
      setActiveDuel(duelId);
      if (snap) applySnapshot(snap);
      setJoinInput('');
      sound.playRewardSound();
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  };

  const handleCancelDuel = async () => {
    if (!activeDuelId) return;
    try {
      await leaveDuel(activeDuelId);
    } catch {
      /* cancel is best-effort */
    }
    setActiveDuel(null);
    setSnapshot(null);
    setPhase('lobby');
  };

  const handleForfeit = async () => {
    if (!activeDuelId) return;
    setConfirmForfeit(false);
    try {
      await leaveDuel(activeDuelId);
      const snap = await getDuelState(activeDuelId);
      if (snap) applySnapshot(snap);
    } catch (err) {
      showError(err);
    }
  };

  const handleClaimForfeit = async () => {
    if (!activeDuelId) return;
    try {
      const snap = await claimForfeit(activeDuelId);
      applySnapshot(snap);
    } catch (err) {
      showError(err);
    }
  };

  const handleExitResult = () => {
    setActiveDuel(null);
    setSnapshot(null);
    setPhase('lobby');
    setCurrentGuess('');
  };

  const handleRematch = () => {
    if (!duel) return;
    handleCreate(duel.difficulty);
  };

  // Preload the dictionary chunk for this duel's length so the first ENTER
  // resolves instantly (fetched in the background, then cached forever).
  useEffect(() => {
    void loadWordBank(duel?.word_length ?? 5);
  }, [duel?.word_length]);

  const submitGuess = () => {
    if (!snapshot || !activeDuelId || submitting) return;
    if (currentGuess.length < snapshot.duel.word_length) {
      sound.playShakeSound();
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const duelId = activeDuelId;
    const wordLength = snapshot.duel.word_length;
    const guess = currentGuess.trim().toUpperCase();

    // Client-side dictionary check, mirroring PuzzleView: the word bank for
    // this length is preloaded, so this resolves in ~0ms. The ref guards
    // against a double-submit while loading; the server re-validates anyway.
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
      setSubmitting(true);
      setError(null);
      try {
        const snap = await submitDuelGuess(duelId, guess);
        const newest = snap.myGuesses[snap.myGuesses.length - 1];
        newest?.colors.forEach((st, idx) => sound.playTileReveal(idx * 0.08, st));
        applySnapshot(snap);
        setCurrentGuess('');
      } catch (err) {
        showError(err);
      } finally {
        setSubmitting(false);
      }
    })();
  };

  const handleKeyPress = (key: string) => {
    if (!myTurnActive) return;
    if (key === 'DELETE' || key === 'BACKSPACE') {
      sound.playKeyDelete();
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (key === 'ENTER') {
      sound.playKeyEnter();
      submitGuess();
    } else if (/^[A-Z]$/.test(key)) {
      const len = snapshot?.duel.word_length ?? 5;
      if (currentGuess.length < len) {
        sound.playKeyPress();
        setCurrentGuess(prev => (prev + key).toUpperCase());
      }
    }
  };

  // Physical keyboard support during the live match
  useEffect(() => {
    if (phase !== 'live') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace') handleKeyPress('DELETE');
      else if (e.key === 'Enter') handleKeyPress('ENTER');
      else if (/^[a-zA-Z]$/.test(e.key)) handleKeyPress(e.key.toUpperCase());
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentGuess, myTurnActive, submitting]);

  const copyToClipboard = async (text: string, what: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      sound.playKeyPress();
      setTimeout(() => setCopied(null), 1600);
    } catch {
      setError('Copying needs clipboard permission — ask a grown-up to help.');
    }
  };

  // Phase 4 — share the invite via the OS share sheet when available
  // (mobile / desktop apps), falling back to clipboard copy.
  const shareDuel = async () => {
    if (!duel) return;
    const url = `${window.location.origin}${window.location.pathname}?duel=${duel.code}`;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'Slotword Duel',
          text: `Race me on Slotword! Use code ${duel.code} — first to solve the word wins!`,
          url,
        });
        return;
      } catch {
        /* sheet dismissed — fall through to clipboard */
      }
    }
    copyToClipboard(url, 'link');
  };

  // ── Board rendering ─────────────────────────────────────────────────
  const tileColors = (state?: 'correct' | 'present' | 'absent') => {
    if (state === 'correct') return { bg: '#79B96B', border: '#5C9B50', text: '#FFFFFF' };
    if (state === 'present') return { bg: '#F2B84B', border: '#D99B28', text: '#3D342F' };
    if (state === 'absent') return { bg: '#AFA8A3', border: '#918984', text: '#FFFFFF' };
    return null;
  };

  const renderMyBoard = (tileSize?: number | null) => {
    if (!snapshot) return null;
    const { word_length: wordLen, attempts_limit: rows } = snapshot.duel;
    const guesses = snapshot.myGuesses;
    const currentRow = me?.status === 'playing' ? guesses.length : -1;

    return (
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rIdx) => {
          const isCurrent = rIdx === currentRow;
          const entry = rIdx < guesses.length ? guesses[rIdx] : null;
          const letters = entry
            ? entry.guess.split('')
            : isCurrent
            ? currentGuess.padEnd(wordLen, ' ').split('')
            : Array(wordLen).fill(' ');
          return (
            <div key={rIdx} className="flex gap-2 justify-center">
              {letters.map((letter, cIdx) => {
                const state = entry ? entry.colors[cIdx] : undefined;
                const c = tileColors(state);
                const filled = letter !== ' ';
                return (
                  <motion.div
                    key={cIdx}
                    initial={false}
                    animate={
                      c
                        ? {
                            rotateX: [0, 90, 0],
                            backgroundColor: ['#FFFCF7', '#FFFCF7', c.bg],
                            borderColor: ['#A99B8D', '#A99B8D', c.border],
                            color: c.text,
                          }
                        : {
                            backgroundColor: filled ? '#FFF4E5' : '#FFFCF7',
                            borderColor: filled ? '#A99B8D' : '#E7DCCB',
                            color: '#3D342F',
                            rotateX: 0,
                          }
                    }
                    transition={{ duration: 0.5, delay: cIdx * 0.08, ease: 'easeInOut' }}
                    className="game-tile relative rounded-lg sm:rounded-xl border-2 font-logo font-bold text-lg sm:text-xl flex items-center justify-center shadow-xs select-none"
                    style={{
                      width: tileSize ?? 44,
                      height: tileSize ?? 44,
                      fontSize: tileSize ? Math.max(15, Math.round(tileSize * 0.45)) : undefined,
                    }}
                  >
                    {filled ? letter : ''}
                    {/* Phase 4 — color-blind-safe glyph: ✓ correct, ◐ present, · absent */}
                    <span
                      className="tile-state-glyph"
                      aria-hidden="true"
                    >
                      {state === 'correct' ? '✓' : state === 'present' ? '◐' : state === 'absent' ? '·' : ''}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const renderKeyboard = () => (
    <div className={`w-full max-w-md mx-auto px-1 ${shake ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}>
      {[
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DELETE'],
      ].map((row, rIdx) => (
        <div key={rIdx} className="osk-row flex justify-center gap-1 sm:gap-1.5 my-1">
          {row.map(key => {
            const isWide = key === 'ENTER' || key === 'DELETE';
            return (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={!myTurnActive}
                className={`${
                  isWide
                    ? 'px-2 sm:px-3 h-11 sm:h-12 text-[10px] sm:text-xs shrink-0 font-extrabold'
                    : 'flex-1 min-w-0 h-11 sm:h-12 text-xs sm:text-sm md:text-base font-bold'
                } font-logo rounded-lg bg-[#F4EBDD] active:bg-[#E7DCCB] hover:bg-[#E7DCCB] text-[#3D342F] shadow-xs cursor-pointer active:scale-95 transition-all touch-manipulation flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {key === 'DELETE' ? <Delete className="w-4 h-4" /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );

  const playerChip = (
    player: DuelPlayerState | null,
    isMe: boolean,
    label: string
  ) => (
    <div
      className={`flex-1 min-w-0 rounded-xl border px-2 py-1.5 ${
        isMe ? 'bg-[#F0F7EE] border-[#CBE3C6]' : 'bg-[#F5F1FB] border-[#E0D8F5]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <div className="w-7 h-7 rounded-full bg-white border border-[#E7DCCB] grid place-items-center text-sm shrink-0 select-none">
          {player?.avatar ? (
            player.avatar
          ) : (
            <User className="w-4 h-4 text-[#A69485]" />
          )}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="flex items-center justify-between gap-1.5">
            <span className="font-logo font-bold text-[11px] text-[#3D342F] truncate">
              {player ? (isMe ? `${player.username} (you)` : player.username) : label}
            </span>
            {player?.status === 'won' ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[#E3F2DD] text-[#5C9E4E] shrink-0">
                ✓ Solved
              </span>
            ) : player?.status === 'lost' ? (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-[#F2ECE4] text-[#998D85] shrink-0">
                Done
              </span>
            ) : player ? (
              <span className="w-2 h-2 rounded-full bg-[#F2B84B] animate-pulse shrink-0" title="Still solving" />
            ) : (
              <span className="text-[9px] font-mono text-[#A69485] shrink-0">waiting…</span>
            )}
          </div>
          {/* Chances left while solving; guesses used + time when done.
              Never the opponent's guesses or colors. */}
          <div className="text-[9.5px] font-mono font-semibold text-[#998D85] mt-0.5">
            {player
              ? player.status !== 'playing'
                ? `${player.attempts} guess${player.attempts === 1 ? '' : 'es'}${player.time_ms != null ? ` · ${fmtMs(player.time_ms)}` : ''}`
                : `${Math.max(0, (duel?.attempts_limit ?? 6) - player.attempts)} chance${(duel?.attempts_limit ?? 6) - player.attempts === 1 ? '' : 's'} left`
              : '—'}
          </div>
        </div>
      </div>
    </div>
  );

  // ═══ RENDER ════════════════════════════════════════════════════════
  return (
    <div
      className={`max-w-4xl mx-auto px-3 sm:px-4 ${isLiveMatch ? 'h-full flex flex-col relative' : ''}`}
    >
      {/* Error banner — floats over a live match so a network hiccup can
          never shrink the board mid-duel. */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={
              isLiveMatch
                ? 'absolute z-30 top-2 left-1/2 -translate-x-1/2 w-[min(94%,26rem)] p-2.5 bg-[#FCE8EC] border border-[#E45C75]/40 rounded-2xl flex items-start gap-2.5 shadow-card'
                : 'max-w-2xl mx-auto mb-5 p-3.5 bg-[#FCE8EC] border border-[#E45C75]/40 rounded-2xl flex items-start gap-3'
            }
          >
            <Zap className="w-4.5 h-4.5 text-[#E45C75] shrink-0 mt-0.5" />
            <p className="flex-1 min-w-0 text-xs text-[#3D342F] font-display">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="px-2.5 py-2.5 text-[10px] font-display font-extrabold text-[#E45C75] hover:bg-[#FCE8EC] rounded-lg transition-colors cursor-pointer shrink-0"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ 1. LOBBY — create or join ═══════════════════════════════ */}
      {phase === 'lobby' && (
        <div className="py-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1.5 -ml-1 px-2.5 py-2.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Lobby
            </button>
            <span className="text-xs text-[#998D85] font-mono flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#F28C6F]" />
              Real duels · two players · no bots
            </span>
          </div>

          <div className="text-center max-w-xl mx-auto mb-8">
            <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] mb-3">Duel Arena</h1>
            <p className="text-sm md:text-base text-[#6F625B]">
              Challenge a friend to the <strong>same word</strong>. First to solve it wins the coins —
              fewer guesses and faster times break ties. Free to enter!
            </p>
          </div>

          {!online ? (
            <div className="max-w-xl mx-auto p-6 bg-[#FFFCF7] border-2 border-dashed border-[#E7DCCB] rounded-3xl text-center space-y-3">
              <WifiOff className="w-8 h-8 text-[#A69485] mx-auto" />
              <h3 className="font-logo font-extrabold text-lg text-[#3D342F]">Duels need the internet</h3>
              <p className="text-xs text-[#6F625B] max-w-sm mx-auto">
                We can't reach the duel club right now. Solo puzzles still work perfectly — come back
                and challenge a friend later!
              </p>
              <button
                onClick={() => onNavigate('play')}
                className="px-5 py-3.5 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_3px_0_#AF324B] transition-all cursor-pointer"
              >
                Play Solo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {/* Create card */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-6 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#FDECE7] border border-[#FADCD5] grid place-items-center mb-4">
                    <Swords className="w-5.5 h-5.5 text-[#F28C6F]" />
                  </div>
                  <h3 className="font-logo font-extrabold text-xl text-[#3D342F]">Create a Duel</h3>
                  <p className="text-xs text-[#6F625B] mt-1.5 leading-relaxed">
                    Pick a difficulty, get a 6-letter code, and send it to a friend. You both get the
                    same secret word.
                  </p>
                </div>
                <motion.button
                  onClick={() => {
                    sound.playKeyPress();
                    setCreateModalOpen(true);
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="mt-5 w-full py-3 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-sm rounded-2xl shadow-[0_3px_0_#AF324B] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Create a Duel
                </motion.button>
              </motion.div>

              {/* Join card */}
              <motion.div
                whileHover={{ y: -3 }}
                className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-6 shadow-card flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-2xl bg-[#E7F5FC] border border-[#D0ECFA] grid place-items-center mb-4">
                    <User className="w-5.5 h-5.5 text-[#65B9E8]" />
                  </div>
                  <h3 className="font-logo font-extrabold text-xl text-[#3D342F]">Join with a Code</h3>
                  <p className="text-xs text-[#6F625B] mt-1.5 leading-relaxed">
                    Got a code from a friend? Pop it in and the match starts right away.
                  </p>
                </div>
                <div className="mt-5 flex gap-2">
                  <input
                    value={joinInput}
                    onChange={e => setJoinInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                    placeholder="ABC123"
                    inputMode="text"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-label="Duel code"
                    className="flex-1 min-w-0 px-4 py-3 border-2 border-[#E7DCCB] rounded-2xl font-mono text-base font-bold tracking-[0.3em] text-center bg-white focus:outline-none focus:border-[#F28C6F] focus:ring-2 focus:ring-[#FDECE7] placeholder:text-[#D8CCBC] placeholder:tracking-normal placeholder:font-display placeholder:text-xs"
                  />
                  <motion.button
                    onClick={handleJoin}
                    disabled={joinInput.length !== 6 || busy !== null}
                    whileTap={{ scale: 0.96 }}
                    className={`px-5 py-3.5 font-display font-extrabold text-sm rounded-2xl transition-all whitespace-nowrap ${
                      joinInput.length === 6 && !busy
                        ? 'bg-[#F28C6F] hover:bg-[#E1774F] text-white shadow-[0_3px_0_#C96A45] cursor-pointer'
                        : 'bg-[#F4EBDD] text-[#A69485] cursor-not-allowed'
                    }`}
                  >
                    {busy === 'joining' ? 'Joining…' : 'Join!'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}

          {/* How it works */}
          <div className="max-w-3xl mx-auto mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { n: '1', t: 'Share the code', d: 'Send the 6-letter code (or link) to a friend.' },
              { n: '2', t: 'Same word', d: 'You both race to solve the same secret word.' },
              { n: '3', t: 'Fastest wins', d: 'First to solve wins. Ties: fewer guesses, then time.' },
            ].map(step => (
              <div key={step.n} className="bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl p-4 text-left">
                <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-[#FFF3D6] text-[#D99B28] font-logo font-black text-xs mb-2">
                  {step.n}
                </span>
                <h4 className="font-logo font-extrabold text-xs text-[#3D342F]">{step.t}</h4>
                <p className="text-[10.5px] text-[#6F625B] mt-0.5 leading-relaxed">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 2. WAITING ROOM — share the code ═══════════════════════ */}
      {phase === 'waiting' && duel && (
        <div className="max-w-xl mx-auto py-6 w-full">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleCancelDuel}
              className="flex items-center gap-1.5 -ml-1 px-2.5 py-2.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Cancel duel
            </button>
            <span className="text-xs text-[#998D85] font-mono">
              {DIFFICULTIES.find(d => d.id === duel.difficulty)?.label} · {duel.word_length} letters ·{' '}
              {duel.attempts_limit} tries
            </span>
          </div>

          <div className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-6 sm:p-8 shadow-card text-center">
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="w-14 h-14 mx-auto rounded-2xl bg-[#FDECE7] border border-[#FADCD5] grid place-items-center mb-4"
            >
              <Users className="w-7 h-7 text-[#F28C6F]" />
            </motion.div>
            <h2 className="font-logo font-extrabold text-2xl text-[#3D342F]">
              Waiting for your friend…
            </h2>
            <p className="text-xs text-[#6F625B] mt-1.5">
              The match starts the second they join. Keep this page open!
            </p>

            {/* Code tiles */}
            <div className="flex justify-center gap-2 my-7">
              {duel.code.split('').map((ch, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, rotate: -4 + i * 2 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 18 }}
                  className="w-11 h-13 sm:w-12 sm:h-14 rounded-xl bg-[#FFF4E5] border-2 border-[#F2B84B] grid place-items-center font-logo font-black text-xl sm:text-2xl text-[#3D342F] shadow-xs select-none"
                >
                  {ch}
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <motion.button
                onClick={() => copyToClipboard(duel.code, 'code')}
                whileTap={{ scale: 0.96 }}
                className="px-5 py-3.5 bg-[#F2B84B] hover:bg-[#E5A92F] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_3px_0_#C48F1F] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied === 'code' ? 'Code copied!' : 'Copy code'}
              </motion.button>
              <motion.button
                onClick={() =>
                  copyToClipboard(
                    `${window.location.origin}${window.location.pathname}?duel=${duel.code}`,
                    'link'
                  )
                }
                whileTap={{ scale: 0.96 }}
                className="px-5 py-3.5 bg-[#FFFCF7] border-2 border-[#E7DCCB] hover:border-[#F28C6F] text-[#3D342F] font-display font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied === 'link' ? <Check className="w-4 h-4 text-[#79B96B]" /> : <LinkIcon className="w-4 h-4" />}
                {copied === 'link' ? 'Link copied!' : 'Copy invite link'}
              </motion.button>
              <motion.button
                onClick={shareDuel}
                whileTap={{ scale: 0.96 }}
                className="px-5 py-3.5 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_3px_0_#AF324B] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Share invite
              </motion.button>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E7DCCB] flex items-center justify-center gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-2 h-2 rounded-full bg-[#F28C6F]"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 3. LIVE MATCH ═══════════════════════════════════════════ */}
      {phase === 'live' && duel && (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
          {/* Header: live badge · timer · exit */}
          <div className="flex-none flex items-center justify-between gap-2 pb-2 border-b border-[#E7DCCB]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#F28C6F] animate-pulse shrink-0" />
              <span className="text-[11px] font-bold text-[#F28C6F] uppercase tracking-wider font-display truncate">
                Live · {duel.code}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-1 bg-[#FFF3D6] text-[#D99B28] rounded-lg font-mono font-bold text-[11px] flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {fmtClock(elapsedSec)}
              </span>
              {confirmForfeit ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-display font-bold text-[#6F625B]">Give up?</span>
                  <button
                    onClick={handleForfeit}
                    className="px-2.5 py-1.5 bg-[#E45C75] text-white text-[10px] font-display font-extrabold rounded-lg cursor-pointer"
                  >
                    Yes, forfeit
                  </button>
                  <button
                    onClick={() => setConfirmForfeit(false)}
                    className="px-2.5 py-1.5 bg-[#F4EBDD] text-[#3D342F] text-[10px] font-display font-extrabold rounded-lg cursor-pointer"
                  >
                    Keep playing
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmForfeit(true)}
                  className="flex items-center gap-1 px-2 py-1.5 text-[10.5px] font-display font-extrabold text-[#A69485] hover:text-[#E45C75] transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Forfeit
                </button>
              )}
            </div>
          </div>

          {/* Player chips */}
          <div className="flex-none flex gap-2 my-2">
            {playerChip(me, true, 'You')}
            {playerChip(opponent, false, 'Opponent')}
          </div>

          {/* Board area: fills the middle. Only the grid is measured, so the
              status strip below can never eat into the tile size and spill
              over the keyboard. min-h keeps tiles usable on short landscape
              screens — the shell scrolls instead of crushing the board. */}
          <div className="flex-1 min-h-[190px] flex flex-col items-center gap-2 overflow-hidden py-1">
            <div
              ref={liveBoardRef}
              className="w-full flex-1 min-h-0 flex items-center justify-center"
            >
              {renderMyBoard(liveTile)}
            </div>

            {/* Conditional status: out-of-guesses notice + claim-forfeit.
                (Solving now settles the duel instantly, so there is no
                "waiting for opponent" state to show.) */}
            {(me?.status === 'lost' && opponent?.status === 'playing') ||
            (opponentIsStale(opponent) && duel.status === 'active') ? (
              <div className="flex-none flex flex-col items-center gap-2">
                {me?.status === 'lost' && opponent?.status === 'playing' && (
                  <p className="text-[11px] font-display font-bold text-[#8B6F3B] bg-[#FFF3D6] border border-[#F2C974] px-3 py-1.5 rounded-full">
                    Out of guesses! {opponent?.username ?? 'Your friend'} is still solving…
                  </p>
                )}
                {opponentIsStale(opponent) && duel.status === 'active' && (
                  <button
                    onClick={handleClaimForfeit}
                    className="px-3 py-1.5 bg-[#FDECE7] hover:bg-[#FCD8CD] border border-[#FADCD5] text-[#D96B4C] font-display font-extrabold text-[11px] rounded-xl transition-colors cursor-pointer"
                  >
                    {opponent?.left_at ? 'Opponent left — claim your win!' : 'Opponent seems away — claim your win'}
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Keyboard: pinned to the bottom of the duel shell (thumb zone) */}
          <div className="flex-none mt-2">{renderKeyboard()}</div>
        </div>
      )}

      {/* ═══ 4. RESULT ═══════════════════════════════════════════════ */}
      {phase === 'result' && duel && (
        <div className="py-6 max-w-md mx-auto w-full">
          <DuelResultSheet
            won={!duel.is_draw && duel.winner_player_id === snapshot?.myPlayerId}
            draw={duel.is_draw}
            word={duel.revealed_word ?? '?????'}
            attempts={me?.attempts ?? 0}
            timeMs={me?.time_ms ?? null}
            opponentName={opponent?.username ?? 'your friend'}
            rewards={
              duelRewards(
                duel.difficulty,
                duel.is_draw ? 'draw' : duel.winner_player_id === snapshot?.myPlayerId ? 'won' : 'lost'
              )
            }
            onRematch={handleRematch}
            onExit={handleExitResult}
          />
        </div>
      )}

      <CreateDuelModal
        isOpen={createModalOpen}
        busy={busy === 'creating'}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
