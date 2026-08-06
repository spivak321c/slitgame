import { motion } from 'motion/react';
import { Flame, ShieldCheck, Trophy, Award, ArrowRight, Play, CheckCircle, Users } from 'lucide-react';
import { ScreenType, Achievement } from '../types';

interface DashboardViewProps {
  onNavigate: (screen: ScreenType) => void;
  streak: number;
  dailySolved: boolean;
  achievements: Achievement[];
}

export default function DashboardView({ onNavigate, streak, dailySolved, achievements }: DashboardViewProps) {
  // Find a locked and an unlocked achievement
  const recentBadge = achievements.find(a => a.unlocked) || achievements[1];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Friendly Top Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] tracking-tight">
            Welcome back, Solver!
          </h1>
          <p className="text-[#6F625B] font-display text-sm md:text-base mt-1">
            Your puzzle workshop is open and warm. Ready for today's words?
          </p>
        </div>
      </div>

      {/* Grid of Activity Home */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        
        {/* 1. Today's Secret Word Card */}
        <motion.div
          className="col-span-1 md:col-span-7 bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#DFCDB3] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_8px_30px_-6px_rgba(61,52,47,0.08)] transition-all duration-200 flex flex-col justify-between"
          whileHover={{ y: -2 }}
        >
          <div>
            <h2 className="text-2xl font-logo font-extrabold text-[#3D342F] mb-2.5 leading-snug">
              {dailySolved ? "Today's Puzzle Completed" : "Today's Secret Word Challenge"}
            </h2>
            <p className="text-sm text-[#6F625B] leading-relaxed mb-6 font-display">
              {dailySolved
                ? "Excellent job! You secured today's record and preserved your streak. Review your solve or challenge a friend in Duels!"
                : "A brand new 5-letter puzzle is locked and ready. Guess the hidden word in 6 attempts with tactile feedback."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {dailySolved ? (
              <motion.button
                id="view-results-btn"
                onClick={() => onNavigate('daily')}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-3 bg-[#EAF5E7] hover:bg-[#D4EFCF] text-[#428033] font-display font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 border border-[#79B96B]/50 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-[#5AA04B]" />
                Review Solve
              </motion.button>
            ) : (
              <motion.button
                id="start-daily-btn"
                onClick={() => onNavigate('daily')}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-3.5 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-sm rounded-2xl shadow-[0_3px_0_#AF324B,0_8px_16px_-4px_rgba(228,92,117,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Today's Word
              </motion.button>
            )}
            
            <motion.button
              id="dash-practice-btn"
              onClick={() => onNavigate('practice')}
              whileTap={{ scale: 0.96 }}
              className="px-6 py-3.5 bg-[#FAF4EA] hover:bg-[#FAF0E1] border border-[#EADBCC] text-[#3D342F] font-display font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center cursor-pointer"
            >
              Practice Puzzles
            </motion.button>
          </div>
        </motion.div>

        {/* 2. Streak Panel (CSS selector 3) */}
        <motion.div
          className="col-span-1 md:col-span-5 bg-[#FFF5DD] border border-[#E9CA81] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(242,184,75,0.12)] hover:shadow-[0_8px_30px_-6px_rgba(242,184,75,0.2)] transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          whileHover={{ y: -2 }}
        >
          {/* Faint flame graphic in the background */}
          <div className="absolute right-[-15px] bottom-[-25px] opacity-15 select-none pointer-events-none">
            <Flame className="w-52 h-52 text-[#F29F05]" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[#D98E04] mb-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#F2C974]/60 flex items-center justify-center shadow-xs">
                <Flame className="w-5 h-5 fill-[#F29F05] text-[#F29F05]" />
              </div>
              <span className="font-logo font-black text-xs uppercase tracking-wider">Daily Flame</span>
            </div>

            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-5xl font-logo font-black text-[#3D342F] tracking-tight">{streak}</span>
              <span className="text-lg font-logo font-bold text-[#7A6B5D]">days active</span>
            </div>

            <p className="text-sm text-[#4E433C] font-display font-medium leading-relaxed">
              {streak >= 6 ? (
                <span>You are on a <strong>{streak}-day streak</strong>! One more day unlocks the <strong>Paper Chain badge</strong>.</span>
              ) : (
                <span>Keep solving puzzles every day to build your master streak and secure limited-edition stamps!</span>
              )}
            </p>
          </div>

          <div className="relative z-10 pt-4 mt-2 border-t border-[#F0D596]/60">
            {/* Playful progress visual */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-display font-bold text-[#7A6B5D]">
                <span>Weekly Streak Goal</span>
                <span className="text-[#3D342F]">{streak}/7 days</span>
              </div>
              <div className="flex gap-2 items-center justify-between">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-3.5 flex-1 rounded-full border transition-all ${
                      i < streak
                        ? 'bg-[#F29F05] border-[#D98E04] shadow-[0_2px_4px_rgba(242,159,5,0.25)]'
                        : 'bg-white/80 border-[#E9CA81]'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Second Row Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Duel Match Arena Banner (CSS selector 4) */}
        <motion.div
          className="bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#F28C6F]/50 rounded-[28px] p-6 shadow-[0_4px_20px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_8px_30px_-6px_rgba(242,140,111,0.12)] transition-all duration-200 flex flex-col justify-between group"
          whileHover={{ y: -2 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#F28C6F]">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#FDECE7] border border-[#FADCD5] flex items-center justify-center">
                <Users className="w-4.5 h-4.5 text-[#F28C6F]" />
              </div>
              <span className="text-xs font-logo font-extrabold uppercase tracking-wider">Duel Matches</span>
            </div>

            <h3 className="text-xl font-logo font-extrabold text-[#3D342F] mb-2">Friendly Arena</h3>
            <p className="text-sm text-[#6F625B] font-display leading-relaxed mb-6">
              Step into a head-to-head match against our clever puzzle animal guides or challenge a friend. Funds are safely protected in match custody until the duel concludes.
            </p>
          </div>

          <motion.button
            onClick={() => onNavigate('duel')}
            whileTap={{ scale: 0.96 }}
            className="w-full py-3 bg-[#FDECE7] hover:bg-[#FCD8CD] border border-[#FADCD5] text-[#D96B4C] font-display font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group-hover:shadow-xs"
          >
            Enter Match Rooms
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>

        {/* Sticker Achievements Panel (CSS selector 5) */}
        <motion.div
          className="bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#8B72C9]/50 rounded-[28px] p-6 shadow-[0_4px_20px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_8px_30px_-6px_rgba(139,114,201,0.12)] transition-all duration-200 flex flex-col justify-between group"
          whileHover={{ y: -2 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#8B72C9]">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#F0ECFA] border border-[#E0D8F5] flex items-center justify-center">
                <Award className="w-4.5 h-4.5 text-[#8B72C9]" />
              </div>
              <span className="text-xs font-logo font-extrabold uppercase tracking-wider">Badge Achievements</span>
            </div>

            <h3 className="text-xl font-logo font-extrabold text-[#3D342F] mb-2">Collectible Badges</h3>
            <p className="text-sm text-[#6F625B] font-display leading-relaxed mb-4">
              Stickers you've earned for puzzle speed, accuracy, and commits.
            </p>

            <div className="flex gap-3.5 items-center mb-5 bg-[#FAF4EA] p-3.5 rounded-2xl border border-[#EADFCB]">
              <div className="w-11 h-11 rounded-full bg-[#F0ECFA] border border-[#8B72C9]/30 flex items-center justify-center text-xl shadow-xs shrink-0 rotate-[-3deg]">
                {recentBadge?.iconType === 'streak-chain' && '⛓️'}
                {recentBadge?.iconType === 'triple-tile' && '📚'}
                {recentBadge?.iconType === 'envelope' && '✉️'}
                {recentBadge?.iconType === 'magnifier' && '🔍'}
              </div>
              <div className="text-left min-w-0">
                <div className="font-logo font-extrabold text-sm text-[#3D342F] truncate">
                  {recentBadge?.title || 'No Badges Yet'}
                </div>
                <div className="text-xs text-[#6F625B] font-display truncate">
                  {recentBadge?.description}
                </div>
              </div>
            </div>
          </div>

          <motion.button
            onClick={() => onNavigate('achievements')}
            whileTap={{ scale: 0.96 }}
            className="w-full py-3 bg-[#F0ECFA] hover:bg-[#E3DCF7] border border-[#E0D8F5] text-[#7155B5] font-display font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group-hover:shadow-xs"
          >
            View Sticker Book
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>

      </div>

      {/* Leaderboards Quick Link (CSS selector 6) */}
      <motion.div
        className="mt-6 p-4 sm:p-5 bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#65B9E8]/50 rounded-[24px] flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_2px_12px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(101,185,232,0.12)] transition-all duration-200 group"
        whileHover={{ y: -1 }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#E7F5FC] border border-[#D0ECFA] flex items-center justify-center text-[#65B9E8] shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h4 className="font-logo font-bold text-sm text-[#3D342F]">Daily Solver Leaderboard</h4>
            <p className="text-xs text-[#6F625B] font-display">Compare finishing attempts and speeds with wordsmiths worldwide.</p>
          </div>
        </div>
        <motion.button
          onClick={() => onNavigate('leaderboard')}
          whileTap={{ scale: 0.96 }}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-display font-extrabold text-[#388FBF] bg-[#E7F5FC] hover:bg-[#D4EFEF] border border-[#D0ECFA] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
        >
          View Rankings <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </motion.div>

    </div>
  );
}

