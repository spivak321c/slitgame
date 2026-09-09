import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Coins, Zap, Swords } from 'lucide-react';
import { sound } from '../utils/audio';

interface DuelResultSheetProps {
  word: string;
  attempts: number;
  won: boolean;
  prizePool: number;
  entryFee: number;
  opponentName: string;
  opponentAvatar: string;
  continueLabel: string;
  onContinue: () => void;
}

export default function DuelResultSheet({
  word,
  attempts,
  won,
  prizePool,
  entryFee,
  opponentName,
  opponentAvatar,
  continueLabel,
  onContinue,
}: DuelResultSheetProps) {
  React.useEffect(() => {
    if (won) sound.playWinSound();
  }, [won]);

  return (
    <div className="relative bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-6 shadow-raised max-w-sm mx-auto overflow-hidden text-center">
      {/* Mono header */}
      <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#6F625B]">
        {won ? 'match complete · victory' : 'match complete · close call'}
      </div>

      {/* Emblem */}
      <motion.div
        initial={{ scale: 0.85, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 16 }}
        className={`w-19 h-19 rounded-[20px] flex items-center justify-center mx-auto my-3.5 shadow-raised ${
          won
            ? 'bg-gradient-to-br from-[#B8E8C4] to-[#79B96B] shadow-[0_8px_16px_rgba(121,185,107,0.35)]'
            : 'bg-gradient-to-br from-[#FBC5B2] to-[#F28C6F] shadow-[0_8px_16px_rgba(242,140,111,0.25)]'
        }`}
      >
        {won ? (
          <Trophy className="w-8 h-8 text-white" strokeWidth={2.5} />
        ) : (
          <Flame className="w-8 h-8 text-white" strokeWidth={2.5} />
        )}
      </motion.div>

      {/* Title */}
      <h4 className="font-logo font-extrabold text-lg text-[#3D342F]">
        {won ? 'Duel Won!' : `${opponentName} takes it`}
      </h4>

      {/* Sub copy */}
      <p className="text-xs text-[#6F625B] mt-1 leading-relaxed">
        {won ? (
          <>
            You solved <span className="font-logo font-bold text-[#3D342F]">{word}</span> in{' '}
            <strong>{attempts}</strong> {attempts === 1 ? 'try' : 'tries'} and beat {opponentAvatar}{' '}
            {opponentName} to the coin pot.
          </>
        ) : (
          <>
            The word was <span className="font-logo font-bold text-[#E45C75]">{word}</span>. You fought
            well — every duel earns XP, win or lose.
          </>
        )}
      </p>

      {/* Coin pot breakdown */}
      <div className="mt-3.5 space-y-2">
        <div className="p-3 bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl text-left">
          <div className="flex justify-between text-[11px] font-mono font-bold text-[#6F625B]">
            <span className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-[#F2B84B]" /> Entry fee
            </span>
            <span className="text-[#3D342F] inline-flex items-center gap-1">{entryFee}<Coins className="w-3.5 h-3.5 text-[#F2B84B]" /></span>
          </div>
          <div className="flex justify-between text-[11px] font-mono font-bold text-[#6F625B] mt-1.5">
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#D99B28]" /> Prize pool
            </span>
            <span className={won ? 'text-[#79B96B] inline-flex items-center gap-1' : 'text-[#998D85] inline-flex items-center gap-1'}>
              {won ? <><span>+{prizePool}</span><Coins className="w-3.5 h-3.5 text-[#F2B84B]" /></> : <><span>{prizePool}</span><Coins className="w-3.5 h-3.5 text-[#F2B84B]" /> (not yours)</>}
            </span>
          </div>
          {!won && (
            <div className="flex justify-between text-[11px] font-mono font-bold text-[#6F625B] mt-1.5">
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#8B72C9]" /> Participation XP
              </span>
              <span className="text-[#8B72C9]">+20 XP</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2 justify-center">
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-[#E45C75] hover:bg-[#C94360] text-white rounded-xl text-xs font-display font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Swords className="w-3.5 h-3.5" />
          {continueLabel}
        </button>
      </div>
    </div>
  );
}