import { motion } from 'motion/react';
import { Award, ArrowLeft, Star } from 'lucide-react';
import { ScreenType, Achievement } from '../types';

interface AchievementsViewProps {
  onNavigate: (screen: ScreenType) => void;
  achievements: Achievement[];
}

export default function AchievementsView({ onNavigate, achievements }: AchievementsViewProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E7DCCB]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {achievements.map((badge, idx) => (
          <motion.div
            key={badge.id}
            className={`border-2 rounded-3xl p-5 shadow-card flex flex-col items-center text-center relative overflow-hidden transition-all ${
              badge.unlocked
                ? 'bg-[#FFFCF7] border-[#8B72C9] hover:shadow-raised'
                : 'bg-[#F4EBDD]/50 border-[#E7DCCB] opacity-70'
            }`}
            initial={{ opacity: 0, scale: 0.95, rotate: idx % 2 === 0 ? -1 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: idx * 0.08 }}
            whileHover={badge.unlocked ? { y: -4, rotate: idx % 2 === 0 ? 1 : -1 } : {}}
          >
            {/* Visual Icon Badge (Collectible Sticker style) */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 shadow-sm border select-none transition-transform duration-150 ${
                badge.unlocked
                  ? 'bg-[#F0ECFA] border-[#8B72C9] rotate-[-4deg]'
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
