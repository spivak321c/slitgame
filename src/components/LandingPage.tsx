import { motion } from 'motion/react';
import { Sparkles, Calendar, BookOpen, Users, ShieldCheck, Trophy, ArrowRight, Star } from 'lucide-react';
import { ScreenType } from '../types';

interface LandingPageProps {
  onNavigate: (screen: ScreenType) => void;
  onConnectWallet: () => void;
  walletConnected: boolean;
}

export default function LandingPage({ onNavigate, onConnectWallet, walletConnected }: LandingPageProps) {
  // Letters spelling SLOTWORD with custom tactile weights and rotation offsets representing wooden toy blocks
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

  // Animation variants for intentional, sophisticated layout reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 110,
        damping: 15,
      }
    }
  };

  const stationsContainerVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 16,
        staggerChildren: 0.08,
        delayChildren: 0.15,
      }
    }
  };

  const cardVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 14,
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 py-8 md:py-14 flex flex-col items-center"
    >
      
      {/* 1. Playful Logo Toy Tray: Frames the blocks in an elegant physical tray structure */}
      <motion.div
        variants={itemVariants}
        className="relative mb-8 md:mb-10 p-4 md:p-6 bg-[#FAF4EA] border border-[#E9DCC6] rounded-3xl shadow-[inset_0_2px_8px_rgba(61,52,47,0.04)] flex items-center justify-center max-w-full"
      >
        {/* Subtle physical wood rivet/corners detail */}
        <div className="absolute top-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-[#E3D4BC]" />
        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#E3D4BC]" />
        <div className="absolute bottom-2.5 left-2.5 w-1.5 h-1.5 rounded-full bg-[#E3D4BC]" />
        <div className="absolute bottom-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#E3D4BC]" />

        <div className="flex gap-1 sm:gap-2 md:gap-3 justify-center flex-wrap">
          {titleLetters.map((item, idx) => (
            <motion.div
              key={idx}
              className={`w-9 h-9 sm:w-12 sm:h-12 md:w-16 md:h-16 ${item.bg} ${item.text} rounded-lg sm:rounded-xl md:rounded-2xl shadow-[0_3px_0_#C5B59E,0_6px_14px_rgba(61,52,47,0.1)] font-logo font-extrabold text-base sm:text-2xl md:text-3.5xl flex items-center justify-center select-none border-b-2 border-black/10`}
              initial={{ scale: 0.8, y: 15, rotate: item.rot }}
              animate={{ scale: 1, y: 0, rotate: item.rot }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 14,
                delay: idx * 0.05 + 0.1,
              }}
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

      {/* 2. Hero Headline Block with Micro-Status Badge */}
      <div className="text-center max-w-xl mb-10 flex flex-col items-center">
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-1.5 px-3 py-1 bg-[#FDF1EE] border border-[#FADCD5] text-[#F28C6F] rounded-full text-[10px] font-display font-extrabold uppercase tracking-wider mb-4 shadow-sm"
        >
          <Sparkles className="w-3 h-3 animate-pulse" />
          <span>Active Challenge Live</span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4.5xl md:text-5xl font-logo font-extrabold tracking-tight text-[#3D342F] leading-tight mb-4"
        >
          Guess today’s hidden word.
        </motion.h1>
        
        <motion.p
          variants={itemVariants}
          className="text-base md:text-lg text-[#6F625B] font-display font-medium leading-relaxed max-w-lg"
        >
          Play for fun, secure your daily streak, or test your speed against puzzle masters in fair, friendly match duels.
        </motion.p>
      </div>

      {/* 3. Intentionally Designed Call To Action (Tactile Play Button with distinct secondary action) */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-4 items-center mb-14 w-full max-w-md justify-center"
      >
        <motion.button
          id="play-today-btn"
          onClick={() => onNavigate('dashboard')}
          whileTap={{ scale: 0.96 }}
          className="group w-full sm:w-auto px-8 py-4 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-base rounded-2xl shadow-[0_4px_0_#AF324B,0_10px_20px_-4px_rgba(228,92,117,0.3)] hover:shadow-[0_6px_0_#AF324B,0_14px_24px_-4px_rgba(228,92,117,0.35)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none transition-all duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Calendar className="w-5 h-5 text-pink-100" />
          <span>Play Today's Puzzle</span>
          <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
        </motion.button>

        <motion.button
          id="practice-btn"
          onClick={() => onNavigate('practice')}
          whileTap={{ scale: 0.96 }}
          className="w-full sm:w-auto px-7 py-4 bg-[#FFFCF7] hover:bg-[#FAF3E7] border-2 border-[#EADBCC] hover:border-[#D1BFAD] text-[#3D342F] font-display font-extrabold text-base rounded-2xl shadow-[0_3px_0_#EADBCC] active:translate-y-0.5 active:shadow-none transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <BookOpen className="w-4.5 h-4.5 text-[#6F625B]" />
          <span>Warm Up Practice</span>
        </motion.button>
      </motion.div>

      {/* 4. Elegant Integrated Trust & Fairness Indicator */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2.5 px-5 py-2.5 bg-[#FAF7F2] border border-[#EADBCC]/60 rounded-full text-xs text-[#5C524D] font-display font-semibold mb-16 shadow-[0_2px_12px_-4px_rgba(61,52,47,0.06)]"
      >
        <ShieldCheck className="w-4.5 h-4.5 text-[#79B96B]" />
        <span>Every puzzle is cryptographically locked to guarantee absolute fairness.</span>
      </motion.div>

      {/* 5. Cozy Cohesive Workshop Stations Layout */}
      <motion.div
        variants={stationsContainerVariants}
        className="w-full bg-[#FCF8F2] border border-[#EADFCB] rounded-[32px] p-6 md:p-8 shadow-[0_4px_24px_-8px_rgba(61,52,47,0.04)]"
      >
        
        {/* Playgrounds Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <span className="text-[10px] font-display font-black text-[#A69485] tracking-[0.25em] uppercase mb-1.5">
            Select Your Workspace
          </span>
          <h2 className="text-xl font-logo font-black text-[#4E433C]">
            Game Modes
          </h2>
          <div className="w-10 h-0.5 bg-[#EADBCC] mt-2 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Daily Puzzle Mode */}
          <motion.div
            id="mode-card-daily"
            variants={cardVariants}
            className="group relative bg-[#FFFCF7] border border-[#EADBCC] hover:border-[#E45C75]/40 rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,52,47,0.02)] hover:shadow-[0_12px_28px_rgba(61,52,47,0.08)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('dashboard')}
          >
            <div>
              <div className="w-11 h-11 bg-[#FFFCF7] border border-[#E45C75]/25 rounded-xl flex items-center justify-center text-[#E45C75] mb-5 shadow-sm transition-all duration-300 group-hover:bg-[#FCE8EC] group-hover:border-[#E45C75]/40">
                <Calendar className="w-5 h-5 text-[#E45C75] transition-transform duration-300 group-hover:scale-105" />
              </div>
              
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-lg font-logo font-bold text-[#3D342F]">Daily Puzzle</h3>
                <span className="px-1.5 py-0.5 bg-[#FCE8EC] text-[#E45C75] text-[9px] font-display font-extrabold rounded-md uppercase">Streak</span>
              </div>
              
              <p className="text-sm text-[#6F625B] leading-relaxed">
                One secret word every day. Lock your guesses, build a daily streak, and unlock collectible sticker badges.
              </p>
            </div>
            
            <div className="mt-6 flex items-center text-xs font-display font-extrabold text-[#E45C75] transition-transform duration-200 group-hover:translate-x-1">
              Start Today's Guess <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </motion.div>

          {/* Practice Mode */}
          <motion.div
            id="mode-card-practice"
            variants={cardVariants}
            className="group bg-[#FFFCF7] border border-[#EADBCC] hover:border-[#65B9E8]/40 rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,52,47,0.02)] hover:shadow-[0_12px_28px_rgba(61,52,47,0.08)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('practice')}
          >
            <div>
              <div className="w-11 h-11 bg-[#FFFCF7] border border-[#65B9E8]/25 rounded-xl flex items-center justify-center text-[#65B9E8] mb-5 shadow-sm transition-all duration-300 group-hover:bg-[#E7F5FC] group-hover:border-[#65B9E8]/40">
                <BookOpen className="w-5 h-5 text-[#65B9E8] transition-transform duration-300 group-hover:scale-105" />
              </div>
              
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-lg font-logo font-bold text-[#3D342F]">Unlimited Practice</h3>
                <span className="px-1.5 py-0.5 bg-[#E7F5FC] text-[#65B9E8] text-[9px] font-display font-extrabold rounded-md uppercase">Warmup</span>
              </div>
              
              <p className="text-sm text-[#6F625B] leading-relaxed">
                Hone your word-guessing patterns. Ideal for learning rules, timing your solves, and training for match duels.
              </p>
            </div>
            
            <div className="mt-6 flex items-center text-xs font-display font-extrabold text-[#65B9E8] transition-transform duration-200 group-hover:translate-x-1">
              Train Word Patterns <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </motion.div>

          {/* Duels Mode */}
          <motion.div
            id="mode-card-duel"
            variants={cardVariants}
            className="group bg-[#FFFCF7] border border-[#EADBCC] hover:border-[#F28C6F]/40 rounded-2xl p-6 shadow-[0_4px_16px_rgba(61,52,47,0.02)] hover:shadow-[0_12px_28px_rgba(61,52,47,0.08)] transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between"
            whileHover={{ y: -4 }}
            onClick={() => onNavigate('duel')}
          >
            <div>
              <div className="w-11 h-11 bg-[#FFFCF7] border border-[#F28C6F]/25 rounded-xl flex items-center justify-center text-[#F28C6F] mb-5 shadow-sm transition-all duration-300 group-hover:bg-[#FDECE7] group-hover:border-[#F28C6F]/40">
                <Users className="w-5 h-5 text-[#F28C6F] transition-transform duration-300 group-hover:scale-105" />
              </div>
              
              <div className="flex items-center gap-1.5 mb-2">
                <h3 className="text-lg font-logo font-bold text-[#3D342F]">Friendly Match Duels</h3>
                <span className="px-1.5 py-0.5 bg-[#FDECE7] text-[#F28C6F] text-[9px] font-display font-extrabold rounded-md uppercase">PVP</span>
              </div>
              
              <p className="text-sm text-[#6F625B] leading-relaxed">
                Challenge skilled puzzle masters. Uses secure Commit-Reveal to guarantee absolute fairness without cheating.
              </p>
            </div>
            
            <div className="mt-6 flex items-center text-xs font-display font-extrabold text-[#F28C6F] transition-transform duration-200 group-hover:translate-x-1">
              Enter Duel Arena <span className="ml-1 transition-transform group-hover:translate-x-0.5">→</span>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </motion.div>
  );
}
