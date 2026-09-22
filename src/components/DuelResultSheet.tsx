import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Coins, Zap, Swords, Handshake, Timer } from 'lucide-react';
import { sound } from '../utils/audio';
import type { DuelRewards } from '../lib/duelTypes';

interface DuelResultSheetProps {
  won: boolean;
  draw: boolean;
  word: string;
  attempts: number;
  timeMs: number | null;
  opponentName: string;
  rewards: DuelRewards;
  onRematch: () => void;
  onExit: () => void;
}

const fmtMs = (ms: number | null) => (ms == null ? '—' : `${(ms / 1000).toFixed(1)}s`);

/**
 * Duel result card (Phase 1 rework): win / draw / loss against a real
 * player, the revealed word, and the rewards the server just recorded.
 */
export default function DuelResultSheet({
  won,
  draw,
  word,
  attempts,
  timeMs,
  opponentName,
  rewards,
  onRematch,
  onExit,
}: DuelResultSheetProps) {
  React.useEffect(() => {
    if (won) sound.playWinSound();
  }, [won]);

  return (
    <div className="relative bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-6 shadow-raised max-w-sm mx-auto overflow-hidden text-center">
      {/* Mono header */}
      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#6F625B]">
        {draw ? 'match complete · tie' : won ? 'match complete · victory' : 'match complete · good try'}
      </div>

      {/* Emblem */}
      <motion.div
        initial={{ scale: 0.85, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className={`w-19 h-19 rounded-[20px] flex items-center justify-center mx-auto my-3.5 shadow-raised ${
          won
            ? 'bg-gradient-to-br from-[#B8E8C4] to-[#79B96B] shadow-[0_8px_16px_rgba(121,185,107,0.35)]'
            : draw
            ? 'bg-gradient-to-br from-[#FDE8C8] to-[#F2B84B] shadow-[0_8px_16px_rgba(242,184,75,0.3)]'
            : 'bg-gradient-to-br from-[#FBC5B2] to-[#F28C6F] shadow-[0_8px_16px_rgba(242,140,111,0.25)]'
        }`}
      >
        {won ? (
          <Trophy className="w-8 h-8 text-white" strokeWidth={2.5} />
        ) : draw ? (
          <Handshake className="w-8 h-8 text-white" strokeWidth={2.5} />
        ) : (
          <Flame className="w-8 h-8 text-white" strokeWidth={2.5} />
        )}
      </motion.div>

      {/* Title */}
      <h4 className="font-logo font-extrabold text-lg text-[#3D342F]">
        {draw ? "It's a tie!" : won ? 'Duel Won!' : `${opponentName} takes it`}
      </h4>

      {/* Sub copy */}
      <p className="text-xs text-[#6F625B] mt-1 leading-relaxed">
        {won ? (
          <>
            The word was <span className="font-logo font-bold text-[#3D342F]">{word}</span> — you beat{' '}
            {opponentName} with <strong>{attempts}</strong>{' '}
            {attempts === 1 ? 'guess' : 'guesses'}!
          </>
        ) : draw ? (
          <>
            Neither of you cracked <span className="font-logo font-bold text-[#3D342F]">{word}</span> —
            great minds think alike. Try a rematch!
          </>
        ) : (
          <>
            The word was <span className="font-logo font-bold text-[#E45C75]">{word}</span>. You fought
            well — every duel earns XP, win or lose.
          </>
        )}
      </p>

      {/* Rewards breakdown */}
      <div className="mt-3.5 space-y-2">
        <div className="p-3 bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl text-left space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono font-bold text-[#6F625B]">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-[#F2B84B]" /> Coins earned
            </span>
            <span className="text-[#3D342F] inline-flex items-center gap-1">
              +{rewards.coins}
              <Coins className="w-3.5 h-3.5 text-[#F2B84B]" />
            </span>
          </div>
          <div className="flex justify-between text-[11px] font-mono font-bold text-[#6F625B]">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-[#8B72C9]" /> XP earned
            </span>
            <span className="text-[#8B72C9]">+{rewards.xp} XP</span>
          </div>
          <div className="flex justify-between text-[11px] font-mono font-bold text-[#6F625B] pt-1.5 border-t border-[#F0E7D8]">
            <span className="flex items-center gap-1">
              <Timer className="w-3.5 h-3.5 text-[#65B9E8]" /> Your time
            </span>
            <span className="text-[#3D342F]">
              {fmtMs(timeMs)} · {attempts} {attempts === 1 ? 'guess' : 'guesses'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 justify-center">
        <button
          onClick={onRematch}
          className="px-5 py-3.5 bg-[#E45C75] hover:bg-[#C94360] text-white rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Swords className="w-3.5 h-3.5" />
          New duel
        </button>
        <button
          onClick={onExit}
          className="px-5 py-3.5 bg-[#F4EBDD] hover:bg-[#E7DCCB] text-[#3D342F] rounded-xl text-xs font-display font-bold transition-colors cursor-pointer"
        >
          Back to arena
        </button>
      </div>
    </div>
  );
}
