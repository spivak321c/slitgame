import { useState, useEffect } from 'react';
import { Swords, X, Coins, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { DIFFICULTIES, type Difficulty } from '../types';
import { sound } from '../utils/audio';

interface CreateDuelModalProps {
  isOpen: boolean;
  busy: boolean;
  onClose: () => void;
  onCreate: (difficulty: Difficulty) => void;
}

/**
 * Create-duel setup (Phase 1 rework): pick a difficulty, the backend picks
 * the secret word and returns a share code. Free to enter — no coin stakes
 * anymore; rewards are earned by winning.
 */
export default function CreateDuelModal({ isOpen, busy, onClose, onCreate }: CreateDuelModalProps) {
  const [selected, setSelected] = useState<Difficulty>('classic');

  useEffect(() => {
    if (isOpen) setSelected('classic');
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D342F]/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#FFFCF7] border border-[#E9DCC6] rounded-[24px] shadow-raised p-6 text-left"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E7DCCB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDECE7] text-[#F28C6F] flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-logo font-extrabold text-lg text-[#3D342F] leading-none">
                Create a duel
              </h3>
              <p className="text-[11px] text-[#6F625B] mt-0.5">
                You'll get a code to send to a friend
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#998D85] hover:text-[#3D342F] p-1.5 rounded-xl hover:bg-[#FAF4EA] cursor-pointer"
            aria-label="Close create duel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <label className="font-mono text-[10.5px] font-bold text-[#998D85] uppercase tracking-wider block">
            Pick your challenge
          </label>

          {DIFFICULTIES.map(cfg => {
            const isPicked = selected === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => {
                  sound.playKeyPress();
                  setSelected(cfg.id);
                }}
                className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
                  isPicked
                    ? 'bg-[#FFF9F0] border-[#F28C6F] shadow-xs'
                    : 'bg-[#FFFCF7] border-[#E7DCCB] hover:bg-[#FAF4EA]'
                }`}
              >
                <span
                  className={`grid place-items-center w-10 h-10 rounded-xl font-logo font-black text-sm shrink-0 ${
                    isPicked ? 'bg-[#F28C6F] text-white' : 'bg-[#F4EBDD] text-[#6F625B]'
                  }`}
                >
                  {cfg.wordLength}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-logo font-extrabold text-sm text-[#3D342F]">{cfg.label}</span>
                    <span className="font-mono text-[10px] text-[#998D85]">
                      {cfg.wordLength} letters · {cfg.attempts} tries
                    </span>
                  </div>
                  <p className="text-[10.5px] text-[#6F625B] mt-0.5">{cfg.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-[#D99B28]">
                    <Coins className="w-3 h-3 text-[#F2B84B]" />
                    {cfg.baseReward * 2}
                  </span>
                  <span className="block text-[9px] text-[#998D85] font-mono mt-0.5">win pot</span>
                </div>
              </button>
            );
          })}

          <div className="p-3 bg-[#FAF4EA] border border-[#EADFCB] rounded-2xl text-[11px] leading-relaxed text-[#6F625B] flex items-start gap-2">
            <Zap className="w-4 h-4 text-[#8B72C9] shrink-0 mt-0.5" />
            <span>
              <strong className="font-logo text-[#3D342F]">Free to enter!</strong> Both duelists get
              the same secret word — winner takes the coin pot, everyone earns a little XP. Coins are
              just for fun.
            </span>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={() => onCreate(selected)}
            className={`w-full py-3.5 px-4 font-display font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all ${
              busy
                ? 'bg-[#F4EBDD] text-[#A69485] cursor-not-allowed'
                : 'bg-[#E45C75] hover:bg-[#D34B64] text-white shadow-[0_3px_0_#AF324B] cursor-pointer active:scale-[0.98]'
            }`}
          >
            <Swords className="w-4 h-4" />
            {busy ? 'Setting up…' : 'Create my duel!'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
