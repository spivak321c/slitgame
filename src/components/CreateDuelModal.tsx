import { useState, useEffect } from 'react';
import { Swords, X, Coins, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DIFFICULTIES, type Difficulty } from '../types';
import { sound } from '../utils/audio';
import { useIsMobile } from '../hooks/useIsMobile';

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
 *
 * Mobile: a native-style bottom sheet — the menu scrolls, the CTA stays
 * pinned in the thumb zone, and the sheet never clips on short viewports
 * (the old centered card cut the difficulty menu off small screens).
 * Desktop: the centered card.
 */
export default function CreateDuelModal({ isOpen, busy, onClose, onCreate }: CreateDuelModalProps) {
  const [selected, setSelected] = useState<Difficulty>('classic');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isOpen) setSelected('classic');
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-50 flex bg-[#3D342F]/40 backdrop-blur-xs ${
            isMobile ? 'items-end' : 'items-center justify-center p-4'
          }`}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: isMobile ? '100%' : 16, scale: isMobile ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: isMobile ? '100%' : 16, scale: isMobile ? 1 : 0.97 }}
            transition={
              isMobile
                ? { type: 'spring', stiffness: 320, damping: 34 }
                : { duration: 0.22, ease: [0.16, 1, 0.3, 1] }
            }
            onClick={e => e.stopPropagation()}
            className={`relative flex flex-col bg-[#FFFCF7] text-left shadow-raised ${
              isMobile
                ? 'w-full max-h-[92dvh] rounded-t-[28px] border-t border-[#E9DCC6] pb-[max(1rem,env(safe-area-inset-bottom))]'
                : 'w-full max-w-md rounded-[24px] border border-[#E9DCC6] p-6'
            }`}
          >
            {/* Sheet grabber — visual hint that the sheet can be dismissed */}
            {isMobile && (
              <div className="mx-auto mt-2.5 mb-0.5 w-10 h-1.5 rounded-full bg-[#E7DCCB] shrink-0" aria-hidden="true" />
            )}

            {/* Header (pinned) */}
            <div
              className={`flex items-center justify-between border-b border-[#E7DCCB] shrink-0 ${
                isMobile ? 'px-5 pb-3 pt-2' : 'pb-3'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FDECE7] text-[#F28C6F] flex items-center justify-center shrink-0">
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
                className="w-10 h-10 grid place-items-center -mr-2 text-[#998D85] hover:text-[#3D342F] rounded-xl hover:bg-[#FAF4EA] cursor-pointer"
                aria-label="Close create duel"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Menu (scrolls on short viewports) */}
            <div className={`min-h-0 overflow-y-auto space-y-3 ${isMobile ? 'px-5 py-4' : 'py-4'}`}>
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
                    className={`w-full min-h-[68px] text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3.5 ${
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
            </div>

            {/* CTA — pinned in the thumb zone on mobile */}
            <div className={`shrink-0 ${isMobile ? 'px-5 pt-3' : ''}`}>
              <button
                type="button"
                disabled={busy}
                onClick={() => onCreate(selected)}
                className={`w-full min-h-[52px] py-3.5 px-4 font-display font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all ${
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
      )}
    </AnimatePresence>
  );
}
