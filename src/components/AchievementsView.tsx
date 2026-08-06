import { motion } from 'motion/react';
import { Award, ArrowLeft, Star } from 'lucide-react';
import { ScreenType, Achievement } from '../types';
import { sound } from '../utils/audio';

interface AchievementsViewProps {
  onNavigate: (screen: ScreenType) => void;
  achievements: Achievement[];
}

export default function AchievementsView({ onNavigate, achievements }: AchievementsViewProps) {
  const handleBadgeClick = (unlocked: boolean) => {
    if (unlocked) {
      sound.playRewardSound();
    } else {
      sound.playShakeSound();
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E7DCCB]">
        <button
          onClick={() => {
            sound.playKeyPress();
            onNavigate('dashboard');
          }}
          className="flex items-center gap-1.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <span className="text-xs text-[#998D85] font-mono">My Badge Stamps</span>
      </div>

      {/* Header Info */}
      <div className="text-center max-w-lg mx-auto mb-10">
        <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] mb-2">
          Your Sticker Book
        </h1>
        <p className="text-sm text-[#6F625B]">
          Earn paper badges and enamel stamps for completing daily solves, exploring fairness records, and conquering match duels.
        </p>
      </div>

      {/* Grid of badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
        {achievements.map((badge, idx) => (
          <motion.div
            key={badge.id}
            onClick={() => handleBadgeClick(badge.unlocked)}
            className={`border rounded-2xl p-5 shadow-card flex flex-col items-center text-center relative overflow-hidden transition-all cursor-pointer ${
              badge.unlocked
                ? 'bg-[#FFFCF7] border-[#8B72C9]'
                : 'bg-[#F4EBDD]/40 border-[#E7DCCB] opacity-75'
            }`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            whileHover={badge.unlocked ? { y: -2 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            {/* Stamp Icon */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 shadow-xs border select-none transition-transform duration-150 ${
                badge.unlocked
                  ? 'bg-[#F0ECFA] border-[#8B72C9]'
                  : 'bg-white border-[#E7DCCB]'
              }`}
            >
              {badge.unlocked ? (
                <span>
                  {badge.iconType === 'streak-chain' && '⛓️'}
                  {badge.iconType === 'triple-tile' && '📚'}
                  {badge.iconType === 'envelope' && '✉️'}
                  {badge.iconType === 'magnifier' && '🔍'}
                </span>
              ) : (
                <span className="opacity-30 filter grayscale">🔒</span>
              )}
            </div>

            <h3 className="text-lg font-logo font-extrabold text-[#3D342F] mb-1">
              {badge.title}
            </h3>
            <p className="text-xs text-[#6F625B] leading-relaxed max-w-[180px] mb-4">
              {badge.description}
            </p>

            <div className="mt-auto">
              {badge.unlocked ? (
                <span className="px-3 py-1 bg-[#E9F6EE] border border-[#79B96B] rounded-full text-[10px] text-[#79B96B] font-bold uppercase tracking-wider font-display">
                  Unlocked Stamp
                </span>
              ) : (
                <span className="px-3 py-1 bg-[#F4EBDD] rounded-full text-[10px] text-[#998D85] font-semibold uppercase tracking-wider font-display">
                  Locked
                </span>
              )}
            </div>

            {/* Faint Sticker Corner peel effect */}
            {badge.unlocked && (
              <div className="absolute right-0 bottom-0 w-6 h-6 bg-gradient-to-tl from-[#E7DCCB] to-[#FFFCF7] border-t border-l border-[#E7DCCB] rounded-tl-xl opacity-30" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Helpful reminder */}
      <div className="bg-[#FFF3D6] border border-[#F2B84B] rounded-2xl p-4 text-center text-xs text-[#3D342F]">
        <span className="font-logo font-bold">Pro Solver Tip:</span> Play the Daily locked Puzzle to build your active streak. Completing tomorrow's validation will instantly secure your Seven Days badge!
      </div>

    </div>
  );
}
