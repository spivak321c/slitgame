import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Lock, Award, Zap, Shield, Coins, Star } from 'lucide-react';
import { ScreenType, Achievement } from '../types';
import { sound } from '../utils/audio';

interface AchievementsViewProps {
  onNavigate: (screen: ScreenType) => void;
  achievements: Achievement[];
}

const ACCENTS: Record<Achievement['iconType'], string> = {
  'tile': '#8B72C9',
  'bolt': '#F2B84B',
  'shield': '#65B9E8',
  'coins': '#F28C6F',
  'star': '#79B96B',
};

const CANDY: Record<Achievement['iconType'], [string, string]> = {
  'tile': ['#A78BFA', '#8B72C9'],
  'bolt': ['#F2C974', '#D99B28'],
  'shield': ['#AEE0F6', '#65B9E8'],
  'coins': ['#FFC4AF', '#F28C6F'],
  'star': ['#A7DF9E', '#79B96B'],
};

const BADGE_ICONS: Record<Achievement['iconType'], typeof Award> = {
  'tile': Award,
  'bolt': Zap,
  'shield': Shield,
  'coins': Coins,
  'star': Star,
};

const EASE_FLIP: [number, number, number, number] = [0.76, 0, 0.24, 1];
const EASE_STAGE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function AchievementsView({ onNavigate, achievements }: AchievementsViewProps) {
  const reduced = useReducedMotion();
  const [pointerFine, setPointerFine] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setPointerFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const toggleBadge = (badge: Achievement) => {
    if (badge.unlocked) {
      sound.playRewardSound();
    } else {
      sound.playShakeSound();
    }
    setOpenId(id => (id === badge.id ? null : badge.id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, badge: Achievement) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleBadge(badge);
    }
  };

  const gridVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } },
  };

  const cardEntryVariants = {
    hidden: { opacity: 0, y: 52, rotateX: -8 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: reduced ? 0 : 0.85, ease: EASE_STAGE },
    },
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
          Earn paper badges and enamel stamps for solves, speed, duel victories, coins, and rising levels. Flip a sticker to read its journal card.
        </p>
      </div>

      {/* Grid of flipping badges */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8"
        variants={gridVariants}
        initial="hidden"
        animate="visible"
      >
        {achievements.map((badge, idx) => {
          const candy = CANDY[badge.iconType];
          const accent = ACCENTS[badge.iconType];
          const isOpen = openId === badge.id;
          const dimmed = openId !== null && !isOpen;

          return (
            <motion.div
              key={badge.id}
              variants={cardEntryVariants}
              style={{ perspective: 1400 }}
              role="button"
              tabIndex={0}
              aria-pressed={isOpen}
              aria-label={`${badge.title} badge`}
              className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#8B72C9] rounded-3xl"
              onMouseEnter={() => {
                if (pointerFine) setOpenId(badge.id);
              }}
              onMouseLeave={() => {
                if (pointerFine) setOpenId(null);
              }}
              onClick={() => {
                if (!pointerFine) toggleBadge(badge);
              }}
              onKeyDown={e => handleKeyDown(e, badge)}
            >
              {/* Grid yield */}
              <motion.div
                className="relative"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{
                  scale: isOpen ? 1.025 : dimmed ? 0.965 : 1,
                  y: isOpen ? 0 : dimmed ? 8 : 0,
                }}
                transition={{ duration: reduced ? 0 : 0.55, ease: EASE_STAGE }}
              >
                {/* Flip card */}
                <div className="relative aspect-[16/11] sm:aspect-[20/21]">
                  <motion.div
                    className="absolute inset-0 [transform-style:preserve-3d]"
                    animate={{ rotateY: isOpen ? 180 : 0 }}
                    transition={{ duration: reduced ? 0 : 0.82, ease: EASE_FLIP }}
                  >
                    {/* Front sticker face */}
                    <div
                      className="absolute inset-0 overflow-hidden rounded-3xl border-4 border-white p-4 sm:p-5 [backface-visibility:hidden] flex flex-col sm:items-center text-start sm:text-center"
                      style={{
                        background: `radial-gradient(120% 90% at 15% 0%, rgba(255,255,255,.45), transparent 46%), linear-gradient(155deg, ${candy[0]} 0%, ${candy[1]} 100%)`,
                        transform: 'rotateY(0deg)',
                        boxShadow:
                          'inset 0 1px 0 rgba(255,255,255,.9), inset 0 -18px 36px rgba(0,0,0,.18), 0 10px 18px -6px rgba(0,0,0,.22)',
                      }}
                    >
                      <div
                        className="flex items-center justify-between font-mono text-[9px] sm:text-[10px] tracking-[0.12em] select-none"
                        style={{ color: 'rgba(255,255,255,.92)', textShadow: '0 1px 0 rgba(0,0,0,.18)' }}
                      >
                        <span>Sticker · S{String(idx + 1).padStart(2, '0')}</span>
                        <span>{badge.unlocked ? 'Unlocked' : 'Locked'}</span>
                      </div>

                      <div className="flex-1 flex items-center justify-center py-3">
                        <div
                          className="w-[42%] max-w-[96px] aspect-square rounded-full grid place-items-center"
                          style={{
                            background: 'radial-gradient(circle at 32% 30%, #fff 0%, #F6F1E9 78%)',
                            boxShadow:
                              'inset 0 -8px 12px rgba(0,0,0,.12), inset 0 4px 10px rgba(255,255,255,.9), 0 10px 16px -6px rgba(0,0,0,.28)',
                          }}
                        >
                          {(() => {
                            const Icon = BADGE_ICONS[badge.iconType];
                            return (
                              <Icon
                                className="text-[#3D342F]"
                                style={{ width: '40%', height: '40%' }}
                                strokeWidth={2.25}
                              />
                            );
                          })()}
                        </div>
                      </div>

                      <h3
                        className="font-logo font-extrabold text-base sm:text-lg leading-tight text-white"
                        style={{ textShadow: '0 2px 0 rgba(0,0,0,.16)' }}
                      >
                        {badge.title}
                      </h3>

                      {!badge.unlocked && (
                        <div
                          className="absolute -top-2 -right-2 w-8 h-8 rounded-full grid place-items-center"
                          style={{
                            background: 'linear-gradient(150deg, #FFF, #F1E7D3)',
                            boxShadow: '0 3px 8px rgba(0,0,0,.22)',
                          }}
                          aria-hidden="true"
                        >
                          <Lock className="w-4 h-4 text-[#998D85]" strokeWidth={2.5} />
                        </div>
                      )}
                    </div>

                    {/* Back journal face */}
                    <div
                      className="absolute inset-0 rounded-3xl border-2 p-4 sm:p-5 [backface-visibility:hidden] flex flex-col"
                      style={{
                        background: '#FFFCF7',
                        borderColor: `${accent}88`,
                        transform: 'rotateY(180deg)',
                        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.6), inset 14px 0 34px rgba(61,52,47,0.05)`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-mono text-[9px] sm:text-[10px] font-semibold tracking-[0.12em] uppercase"
                          style={{ color: accent }}
                        >
                          Sticker · Journal
                        </span>
                        <span className="font-mono text-[10px] text-[#998D85]">№ {String(idx + 1).padStart(2, '0')}</span>
                      </div>

                      <h3 className="font-logo font-extrabold text-base sm:text-lg text-[#3D342F] mt-3 leading-tight">
                        {badge.title}
                      </h3>
                      <p className="text-xs sm:text-[13px] text-[#6F625B] leading-relaxed mt-2">
                        {badge.description}
                      </p>

                      <div className="mt-auto pt-3">
                        {badge.unlocked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E9F6EE] border border-[#79B96B] rounded-full text-[10px] text-[#79B96B] font-bold uppercase tracking-wider font-display">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#79B96B]" />
                            Unlocked Stamp
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4EBDD] rounded-full text-[10px] text-[#998D85] font-semibold uppercase tracking-wider font-display">
                            <Lock className="w-3 h-3" />
                            Locked — keep solving
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Helpful reminder */}
      <div className="bg-[#FFF3D6] border border-[#F2B84B] rounded-2xl p-4 text-center text-xs text-[#3D342F]">
        <span className="font-logo font-bold">Pro Solver Tip:</span> Win puzzles and keep your attempts under 3 to earn the Speed Solver badge — win a duel to unlock Duel Champion!
      </div>
    </div>
  );
}