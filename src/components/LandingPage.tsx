import { motion } from 'motion/react';
import { Gamepad2, Users, Award, ArrowRight } from 'lucide-react';
import { ScreenType } from '../types';

interface LandingPageProps {
  onNavigate: (screen: ScreenType) => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const titleLetters = [
    { char: 'S', bg: 'bg-[#E45C75]', text: 'text-white', rot: -5 },
    { char: 'L', bg: 'bg-[#65B9E8]', text: 'text-white', rot: 3 },
    { char: 'O', bg: 'bg-[#F2B84B]', text: 'text-[#3D342F]', rot: -2 },
    { char: 'T', bg: 'bg-[#79B96B]', text: 'text-white', rot: 6 },
    { char: 'W', bg: 'bg-[#8B72C9]', text: 'text-white', rot: -4 },
    { char: 'O', bg: 'bg-[#F28C6F]', text: 'text-white', rot: 4 },
    { char: 'R', bg: 'bg-[#A8D8B9]', text: 'text-[#3D342F]', rot: -3 },
    { char: 'D', bg: 'bg-[#E45C75]', text: 'text-white', rot: 3 },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 110, damping: 15 }
    }
  };

  const stationsContainerVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 90, damping: 16, staggerChildren: 0.08, delayChildren: 0.15 }
    }
  };

  const cardVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 120, damping: 14 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 py-8 md:py-14 flex flex-col items-center"
    >

      <motion.div
        variants={itemVariants}
        className="relative mb-8 md:mb-10 p-4 md:p-6 bg-[#FAF4EA] border border-[#E9DCC6] rounded-3xl shadow-[inset_0_2px_8px_rgba(61,52,47,0.04)] flex items-center justify-center max-w-full"
      >
        <div className="flex gap-1 sm:gap-2 md:gap-3 justify-center flex-wrap">
          {titleLetters.map((item, idx) => (
            <motion.div
              key={idx}
              className={`w-9 h-9 sm:w-12 sm:h-12 md:w-16 md:h-16 ${item.bg} ${item.text} rounded-lg sm:rounded-xl md:rounded-2xl shadow-[0_3px_0_#C5B59E,0_6px_14px_rgba(61,52,47,0.1)] font-logo font-extrabold text-xl sm:text-2xl md:text-4xl flex items-center justify-center select-none`}
              initial={{ scale: 0.8, y: 15, rotate: item.rot }}
              animate={{ scale: 1, y: 0, rotate: item.rot }}
              transition={{ type: 'spring', stiffness: 280, damping: 14, delay: idx * 0.05 + 0.1 }}
              whileHover={{
                scale: 1.08,
                rotate: item.rot * 1.6 - (idx % 2 === 0 ? 3 : -3),
                y: -6,
                transition: { duration: 0.12 }
              }}
            >
              {item.char}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="text-center max-w-xl mb-10 flex flex-col items-center">
        <motion.h1
          variants={itemVariants}
          className="text-4xl md:text-5xl font-logo font-extrabold tracking-tight text-[#3D342F] leading-tight mb-4"
        >
          Guess the hidden word.
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-base md:text-lg text-[#6F625B] font-display font-medium leading-relaxed max-w-lg"
        >
          Warm, friendly word puzzles for every mood — quick 4-letter rounds or grand 6-letter battles. Earn coins and XP, then put them on the line in match duels.
        </motion.p>
      </div>

      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 items-center mb-14 w-full max-w-md justify-center"
      >
        <motion.button
          id="play-now-btn"
          onClick={() => onNavigate('play')}
          whileTap={{ scale: 0.96 }}
          className="group w-full sm:w-auto px-8 py-4 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-base rounded-2xl shadow-[0_4px_0_#AF324B,0_10px_20px_-4px_rgba(228,92,117,0.3)] hover:shadow-[0_6px_0_#AF324B,0_14px_24px_-4px_rgba(228,92,117,0.35)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Gamepad2 className="w-5 h-5 text-white/90" />
          <span>Play Now</span>
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </motion.button>

        <motion.button
          id="duel-btn"
          onClick={() => onNavigate('duel')}
          whileTap={{ scale: 0.96 }}
          className="w-full sm:w-auto px-7 py-4 bg-[#FFFCF7] hover:bg-[#FAF3E7] border-2 border-[#EADBCC] hover:border-[#D1BFAD] text-[#3D342F] font-display font-extrabold text-base rounded-2xl shadow-[0_3px_0_#EADBCC] active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Users className="w-4.5 h-4.5 text-[#F28C6F]" />
          <span>Enter Duels</span>
        </motion.button>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2.5 px-5 py-2.5 bg-[#FAF7F2] border border-[#EADBCC]/60 rounded-full text-xs text-[#5C524D] font-display font-semibold mb-16 shadow-[0_2px_12px_-4px_rgba(61,52,47,0.06)]"
      >
        <span>Coins are purely for fun — earn them solving puzzles, spend them in duels.</span>
      </motion.div>

      <motion.div
        variants={stationsContainerVariants}
        className="w-full bg-[#FCF8F2] border border-[#EADFCB] rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_-8px_rgba(61,52,47,0.04)]"
      >
        {/* Featured: Puzzle Pit (larger, primary) */}
        <motion.div
          id="mode-card-play"
          variants={cardVariants}
          className="group relative bg-[#FFFCF7] border border-[#EADBCC] hover:border-[#E45C75]/40 rounded-2xl p-6 md:p-8 shadow-[0_4px_16px_rgba(61,52,47,0.02)] hover:shadow-[0_12px_28px_rgba(61,52,47,0.08)] transition-all duration-300 ease-out cursor-pointer mb-6"
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('play')}
        >
          <div className="flex flex-col md:flex-row md:items-start gap-5">
            <div className="w-14 h-14 bg-[#FFFCF7] border border-[#E45C75]/25 rounded-2xl flex items-center justify-center text-[#E45C75] shadow-sm transition-all duration-300 group-hover:bg-[#FCE8EC] group-hover:border-[#E45C75]/40 shrink-0">
              <Gamepad2 className="w-6 h-6 transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-2xl font-logo font-black text-[#3D342F]">Puzzle Pit</h3>
                <span className="px-1.5 py-0.5 bg-[#FCE8EC] text-[#E45C75] text-[9px] font-display font-extrabold rounded-md uppercase">Solo</span>
              </div>
              <p className="text-sm text-[#6F625B] leading-relaxed max-w-prose">
                Three difficulty tiers — Quick 4-letter rounds, Classic 5-letter tests, and Grand 6-letter challenges. Earn coins and XP on every solve, chase faster attempts to grow the bonus.
              </p>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-display font-extrabold text-[#E45C75]">
                Start Guessing <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Secondary: Duels + Sticker Book as a two-up row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            id="mode-card-duel"
            variants={cardVariants}
            className="group bg-[#FFFCF7] border border-[#EADBCC] hover:border-[#F28C6F]/40 rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,52,47,0.02)] hover:shadow-[0_12px_28px_rgba(61,52,47,0.08)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('duel')}
          >
            <div>
              <div className="w-11 h-11 bg-[#FFFCF7] border border-[#F28C6F]/25 rounded-xl flex items-center justify-center text-[#F28C6F] mb-4 shadow-sm transition-all duration-300 group-hover:bg-[#FDECE7] group-hover:border-[#F28C6F]/40">
                <Users className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="text-lg font-logo font-bold text-[#3D342F] mb-2">Match Duels</h3>
              <p className="text-sm text-[#6F625B] leading-relaxed">
                Challenge clever rivals head-to-head on the same word. Winner takes the coin pot — pure wits, no luck.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-display font-extrabold text-[#F28C6F]">
              Enter Duel Arena <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </motion.div>

          <motion.div
            id="mode-card-badges"
            variants={cardVariants}
            className="group bg-[#FFFCF7] border border-[#EADBCC] hover:border-[#8B72C9]/40 rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,52,47,0.02)] hover:shadow-[0_12px_28px_rgba(61,52,47,0.08)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('achievements')}
          >
            <div>
              <div className="w-11 h-11 bg-[#FFFCF7] border border-[#8B72C9]/25 rounded-xl flex items-center justify-center text-[#8B72C9] mb-4 shadow-sm transition-all duration-300 group-hover:bg-[#F0ECFA] group-hover:border-[#8B72C9]/40">
                <Award className="w-5 h-5 transition-transform duration-300 group-hover:scale-105" />
              </div>
              <h3 className="text-lg font-logo font-bold text-[#3D342F] mb-2">Sticker Book</h3>
              <p className="text-sm text-[#6F625B] leading-relaxed">
                Collect flip-card stickers for first solves, speed wins, duel victories, and rising levels. Flip a sticker to read its journal card.
              </p>
            </div>
            <div className="mt-5 flex items-center gap-1.5 text-xs font-display font-extrabold text-[#8B72C9]">
              Open Sticker Book <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
