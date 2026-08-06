import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Play } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartPlay?: () => void;
}

export default function HowToPlayModal({ isOpen, onClose, onStartPlay }: HowToPlayModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#3D342F]/40 backdrop-blur-xs overflow-y-auto">
        {/* Backdrop click to close */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="relative w-full max-w-lg bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-raised z-10 text-left max-h-[90vh] sm:max-h-[85vh] flex flex-col my-auto"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#E7DCCB] mb-3 sm:mb-5 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-[#FFF3D6] border border-[#F2B84B] flex items-center justify-center text-[#D98E04] shrink-0">
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-logo font-black text-lg sm:text-xl text-[#3D342F] leading-tight">How to Play</h3>
                <p className="text-[11px] sm:text-xs text-[#6F625B] font-display">Easy 3-step guide for solvers of all ages!</p>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              whileTap={{ scale: 0.92 }}
              className="p-1.5 sm:p-2 bg-[#F4EBDD] hover:bg-[#E7DCCB] rounded-xl text-[#3D342F] transition-colors cursor-pointer shrink-0"
              aria-label="Close guide"
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Scrollable Guide Content */}
          <div className="overflow-y-auto space-y-4 sm:space-y-5 pr-1 pb-1 text-xs font-display leading-relaxed">
            
            {/* Step 1: Objective */}
            <div className="flex gap-2.5 sm:gap-3.5 items-start">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#E45C75] text-white font-logo font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="font-logo font-extrabold text-sm sm:text-base text-[#3D342F] mb-0.5">
                  Guess the 5-Letter Secret Word
                </h4>
                <p className="text-[#6F625B]">
                  You have <strong className="text-[#3D342F]">6 attempts</strong> to figure out the hidden word. Type any valid 5-letter word and press <strong className="text-[#3D342F]">ENTER</strong>.
                </p>
              </div>
            </div>

            {/* Step 2: Tile Color Meaning (Visual Examples) */}
            <div className="flex gap-2.5 sm:gap-3.5 items-start">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#F2B84B] text-white font-logo font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                2
              </div>
              <div className="w-full min-w-0">
                <h4 className="font-logo font-extrabold text-sm sm:text-base text-[#3D342F] mb-1">
                  Watch the Tile Colors
                </h4>
                <p className="text-[#6F625B] mb-2.5">
                  After each guess, the tile colors reveal hints:
                </p>

                {/* Color Rules Stack */}
                <div className="space-y-2">
                  {/* Green Rule */}
                  <div className="flex items-center gap-2.5 p-2 sm:p-2.5 bg-[#EAF5E7] border border-[#79B96B]/40 rounded-xl sm:rounded-2xl">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#79B96B] text-white font-logo font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
                      C
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-[#346028] text-xs block">Green = Right Spot!</span>
                      <p className="text-[11px] text-[#428033] leading-tight">The letter is in the word and in the exact right place.</p>
                    </div>
                  </div>

                  {/* Yellow Rule */}
                  <div className="flex items-center gap-2.5 p-2 sm:p-2.5 bg-[#FFF8E7] border border-[#F2B84B]/50 rounded-xl sm:rounded-2xl">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#F2B84B] text-white font-logo font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
                      A
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-[#8C6313] text-xs block">Yellow = In the Word!</span>
                      <p className="text-[11px] text-[#A67B22] leading-tight">The letter is in the word, but needs to move to another spot.</p>
                    </div>
                  </div>

                  {/* Gray Rule */}
                  <div className="flex items-center gap-2.5 p-2 sm:p-2.5 bg-[#F4EBDD]/60 border border-[#E7DCCB] rounded-xl sm:rounded-2xl">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#A69485] text-white font-logo font-black text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs">
                      X
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-[#4E433C] text-xs block">Gray = Not in Word</span>
                      <p className="text-[11px] text-[#6F625B] leading-tight">This letter isn't anywhere in today's hidden word.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Interactive Row Preview */}
            <div className="bg-[#FAF4EA] border border-[#EADFCB] rounded-xl sm:rounded-2xl p-3 sm:p-3.5 text-center">
              <span className="text-[10px] sm:text-[11px] font-display font-bold uppercase tracking-wider text-[#A69485] mb-2 block">
                Example Word: "C R A F T"
              </span>
              <div className="flex justify-center gap-1.5 sm:gap-2 mb-1.5">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#79B96B] text-white font-logo font-black text-xs sm:text-base flex items-center justify-center shadow-xs">C</div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#F2B84B] text-white font-logo font-black text-xs sm:text-base flex items-center justify-center shadow-xs">R</div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#A69485] text-white font-logo font-black text-xs sm:text-base flex items-center justify-center shadow-xs">A</div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#79B96B] text-white font-logo font-black text-xs sm:text-base flex items-center justify-center shadow-xs">F</div>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#A69485] text-white font-logo font-black text-xs sm:text-base flex items-center justify-center shadow-xs">T</div>
              </div>
              <p className="text-[11px] text-[#6F625B]">
                <strong className="text-[#79B96B]">C</strong> and <strong className="text-[#79B96B]">F</strong> are spot-on! <strong className="text-[#D98E04]">R</strong> is in the word but wrong spot!
              </p>
            </div>

            {/* Step 3: Pro Tips */}
            <div className="flex gap-2.5 sm:gap-3.5 items-start">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#65B9E8] text-white font-logo font-extrabold text-xs sm:text-sm flex items-center justify-center shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="font-logo font-extrabold text-sm sm:text-base text-[#3D342F] mb-0.5">
                  Tips for Beginners
                </h4>
                <ul className="text-[11px] sm:text-xs text-[#6F625B] space-y-1 list-disc list-inside">
                  <li>Start with vowel-rich words like <strong className="text-[#3D342F]">SMART</strong>, <strong className="text-[#3D342F]">TEACH</strong>, or <strong className="text-[#3D342F]">AUDIO</strong>.</li>
                  <li>Letters can repeat in a word (like <strong className="text-[#3D342F]">APPLE</strong> or <strong className="text-[#3D342F]">SPEED</strong>).</li>
                  <li>Use <strong className="text-[#3D342F]">Practice Mode</strong> for endless attempts with no pressure!</li>
                </ul>
              </div>
            </div>

          </div>

          {/* Footer Action */}
          <div className="pt-3 sm:pt-4 border-t border-[#E7DCCB] mt-2 shrink-0">
            <button
              onClick={() => {
                onClose();
                if (onStartPlay) onStartPlay();
              }}
              className="w-full py-2.5 sm:py-3 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white" />
              <span>Got it, Let's Play!</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
