import { motion } from 'motion/react';
import { Trophy, Award, ArrowRight, Play, Users, TrendingUp, Zap, Coins, Gamepad2, Swords, Flame, ShoppingBag, BookOpen, Target } from 'lucide-react';
import { ScreenType, Achievement, PlayerProfile, levelFromXp, levelTitle, StreakInfo, Quest, todayStr, type Difficulty } from '../types';
import type { RecentOpponent } from '../lib/duelTypes';
import MascotBubble from './MascotBubble';
import ChestCard from './ChestCard';
import QuestCard from './QuestCard';
import RecentRivals from './RecentRivals';

const BADGE_ICONS: Record<Achievement['iconType'], typeof Award> = {
  'tile': Award,
  'bolt': Zap,
  'shield': Swords,
  'coins': Coins,
  'star': Trophy,
};

interface DashboardViewProps {
  onNavigate: (screen: ScreenType) => void;
  profile: PlayerProfile;
  achievements: Achievement[];
  activeDuelId: string | null;
  streak: StreakInfo;
  dailyChestLastOpened: string | null;
  onOpenChest: () => void;
  quests: Quest[];
  onClaimQuest: (questId: string) => void;
  equippedMascotItem: string | null;
  ownedStickerCount: number;
  recentOpponents: RecentOpponent[];
  onChallengeRival: (difficulty: Difficulty) => void;
}

export default function DashboardView({
  onNavigate,
  profile,
  achievements,
  activeDuelId,
  streak,
  dailyChestLastOpened,
  onOpenChest,
  quests,
  onClaimQuest,
  equippedMascotItem,
  ownedStickerCount,
  recentOpponents,
  onChallengeRival,
}: DashboardViewProps) {
  // Find a locked and an unlocked achievement
  const recentBadge = achievements.find(a => a.unlocked) || achievements[1];
  const level = levelFromXp(profile.xp);
  const solvedCount = profile.gamesWon;
  const today = todayStr();
  const playedToday = streak.lastPlayedDate === today;

  // Mascot greeting messages — positive, encouraging, contextual
  const mascotMessage = (() => {
    if (streak.current >= 7) return `${streak.current}-day streak! You're on fire!`;
    if (solvedCount === 0) return 'Hi! I\'m Slit! Ready to solve your first puzzle?';
    if (playedToday) return 'Great solving today! Come back tomorrow for more!';
    return 'Welcome back! Let\'s solve some words together!';
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Friendly Top Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-end gap-3">
          <MascotBubble
            mood={streak.current >= 3 ? 'excited' : 'happy'}
            message={mascotMessage}
            level={level.level}
            equippedItem={equippedMascotItem}
            compact
          />
          <div>
            <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] tracking-tight">
              Welcome back, {profile.username}!
            </h1>
            <p className="text-[#6F625B] font-display text-sm md:text-base mt-1">
              Your puzzle workshop is open and warm. Ready for some words?
            </p>
          </div>
        </div>
        {/* Streak flame counter */}
        {streak.current > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-4 py-2 bg-[#FDECE7] border border-[#FADCD5] rounded-2xl shrink-0"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 rounded-xl bg-[#FDECE7] border border-[#FADCD5] flex items-center justify-center"
            >
              <Flame className="w-5 h-5 text-[#F28C6F]" />
            </motion.div>
            <div>
              <div className="font-logo font-black text-lg text-[#F28C6F] leading-none">{streak.current}</div>
              <div className="text-[10px] text-[#998D85] font-mono">day streak</div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Grid of Activity Home */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        
        {/* 1. Puzzle Pit Card */}
        <motion.div
          className="col-span-1 md:col-span-7 bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#DFCDB3] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_8px_30px_-6px_rgba(61,52,47,0.08)] transition-all duration-200 flex flex-col justify-between"
          whileHover={{ y: -2 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="w-8.5 h-8.5 rounded-xl bg-[#FCE8EC] border border-[#F5C9D3] flex items-center justify-center">
                <Gamepad2 className="w-4.5 h-4.5 text-[#E45C75]" />
              </span>
              <h2 className="text-2xl font-logo font-extrabold text-[#3D342F] leading-snug">
                Puzzle Pit
              </h2>
            </div>
            <p className="text-sm text-[#6F625B] leading-relaxed mb-6 font-display">
              {solvedCount > 0 ? (
                <span>You've solved <strong>{solvedCount}</strong> {solvedCount === 1 ? 'puzzle' : 'puzzles'} so far. Pick a difficulty — Quick, Classic, or Grand — and chase your best attempts.</span>
              ) : (
                <span>Pick a difficulty — Quick 4-letter rounds, Classic 5-letter tests, or Grand 6-letter challenges. Earn coins and XP on every puzzle.</span>
              )}
            </p>

            {/* Best attempts summary */}
            <div className="flex flex-wrap gap-2 mb-5">
              {[
                { label: 'Quick', value: profile.bestAttempts.easy, color: 'text-[#5E9A50]', bg: 'bg-[#EAF5E7] border-[#BFE3C9]' },
                { label: 'Classic', value: profile.bestAttempts.classic, color: 'text-[#D34B64]', bg: 'bg-[#FCE8EC] border-[#F5C9D3]' },
                { label: 'Grand', value: profile.bestAttempts.hard, color: 'text-[#6B55A8]', bg: 'bg-[#F0ECFA] border-[#E0D8F5]' },
              ].map(item => (
                <div key={item.label} className={`px-3 py-1.5 rounded-full border font-mono text-[11px] font-bold ${item.bg} ${item.color}`}>
                  {item.label}: {item.value === null ? '—' : `${item.value} tries`}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <motion.button
              id="start-play-btn"
              onClick={() => onNavigate('play')}
              whileTap={{ scale: 0.96 }}
              className="px-6 py-3.5 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-sm rounded-2xl shadow-[0_3px_0_#AF324B,0_8px_16px_-4px_rgba(228,92,117,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Play a Puzzle
            </motion.button>
          </div>
        </motion.div>

        {/* 2. Level & XP Panel */}
        <motion.div
          className="col-span-1 md:col-span-5 bg-[#F5F1FB] border border-[#E0D8F5] rounded-[28px] p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(139,114,201,0.12)] hover:shadow-[0_8px_30px_-6px_rgba(139,114,201,0.2)] transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
          whileHover={{ y: -2 }}
        >

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-[#7155B5] mb-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DDF8]/60 flex items-center justify-center shadow-xs">
                <TrendingUp className="w-5 h-5 text-[#8B72C9]" />
              </div>
              <h2 className="font-logo font-black text-base uppercase tracking-wider text-[#3D342F]">Level & XP</h2>
            </div>

            <div className="mb-3 flex items-baseline gap-2">
              <span className="text-5xl font-logo font-black text-[#3D342F] tracking-tight">{level.level}</span>
              <span className="text-lg font-logo font-bold text-[#7A6B5D]">{levelTitle(level.level)}</span>
            </div>

            <p className="text-sm text-[#4E433C] font-display font-medium leading-relaxed mb-4">
              {profile.xp === 0 ? (
                <span>Solve puzzles and win duels to earn XP and grow your level. New titles unlock as you climb!</span>
              ) : (
                <span>You've earned <strong>{profile.xp} XP</strong> in total. Keep playing to reach <strong>{levelTitle(level.level + 1)}</strong>!</span>
              )}
            </p>
          </div>

          <div className="relative z-10 pt-4 mt-2 border-t border-[#E8E0F8]/70">
            {/* Progress visual */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs font-display font-bold text-[#7A6B5D]">
                <span>Level {level.level} → {level.level + 1}</span>
                <span className="text-[#3D342F] font-mono">{level.intoLevel}/{level.neededForLevel} XP</span>
              </div>
              <div className="h-3.5 bg-white/80 border border-[#E5DDF8] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#8B72C9] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (level.intoLevel / level.neededForLevel) * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="flex items-center gap-1 font-mono text-[10.5px] font-bold text-[#7A6B5D]">
                  <Coins className="w-3 h-3 text-[#F2B84B]" /> {profile.coins} coins pouch
                </span>
                <span className="font-mono text-[10.5px] font-bold text-[#79B96B]">
                  {profile.gamesWon}W · {profile.duelsWon} duel wins
                </span>
              </div>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Daily Chest + Quests Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ChestCard lastOpened={dailyChestLastOpened} onOpen={onOpenChest} />

        {/* Quests summary — spans 2 cols */}
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#E45C75]" />
            <h3 className="font-logo font-extrabold text-sm text-[#3D342F]">Daily Quests</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {quests.map(q => (
              <QuestCard key={q.id} quest={q} onClaim={onClaimQuest} />
            ))}
            {quests.length === 0 && (
              <div className="col-span-full p-3 bg-[#FAF4EA] border border-dashed border-[#EADFCB] rounded-xl text-center">
                <p className="text-xs text-[#998D85] font-display">Quests refresh daily — come back tomorrow!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Duel Match Arena Banner */}
        <motion.div
          className="bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#F28C6F]/50 rounded-[28px] p-6 shadow-[0_4px_20px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_8px_30px_-6px_rgba(242,140,111,0.12)] transition-all duration-200 flex flex-col justify-between group"
          whileHover={{ y: -2 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#FDECE7] border border-[#FADCD5] flex items-center justify-center text-[#F28C6F]">
                <Users className="w-4.5 h-4.5 text-[#F28C6F]" />
              </div>
              <h3 className="text-xl font-logo font-extrabold text-[#3D342F]">Duel a Friend</h3>
              {activeDuelId && (
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#428033] bg-[#EAF5E7] border border-[#BFE3C9] px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#79B96B] animate-pulse" />
                  Duel live
                </span>
              )}
            </div>

            <p className="text-sm text-[#6F625B] font-display leading-relaxed mb-5">
              Challenge a friend to the same secret word — share a 6-letter code and race live.
              Real players only, no bots! First to solve wins the coin pot.
            </p>

            {activeDuelId ? (
              <div className="flex items-center gap-3 mb-5 p-3.5 bg-[#EAF5E7] border border-[#BFE3C9] rounded-2xl">
                <Swords className="w-5 h-5 text-[#428033] shrink-0" />
                <p className="text-xs text-[#3D342F] font-display font-bold flex-1">
                  You have a duel waiting — jump back in!
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-5 p-3.5 bg-[#FAF4EA] border border-dashed border-[#DCCFB8] rounded-2xl">
                <Swords className="w-5 h-5 text-[#A69485] shrink-0" />
                <p className="text-xs text-[#6F625B] font-display">
                  No duel running. Create one and send the code to a friend!
                </p>
              </div>
            )}
          </div>

          <motion.button
            onClick={() => onNavigate('duel')}
            whileTap={{ scale: 0.96 }}
            className="w-full py-3 bg-[#FDECE7] hover:bg-[#FCD8CD] border border-[#FADCD5] text-[#D96B4C] font-display font-extrabold text-sm rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer group-hover:shadow-xs"
          >
            {activeDuelId ? 'Return to Your Duel' : 'Enter Duel Arena'}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.button>
        </motion.div>

        {/* Sticker Achievements Panel */}
        <motion.div
          className="bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#8B72C9]/50 rounded-[28px] p-6 shadow-[0_4px_20px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_8px_30px_-6px_rgba(139,114,201,0.12)] transition-all duration-200 flex flex-col justify-between group"
          whileHover={{ y: -2 }}
        >
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#F0ECFA] border border-[#E0D8F5] flex items-center justify-center">
                <Award className="w-4.5 h-4.5 text-[#8B72C9]" />
              </div>
              <h3 className="text-xl font-logo font-extrabold text-[#3D342F]">Collectible Badges</h3>
            </div>

            <p className="text-sm text-[#6F625B] font-display leading-relaxed mb-4">
              Flip-card stickers you've earned for solves, speed, duels, and levels.
            </p>

            <div className="flex gap-3.5 items-center mb-5 bg-[#FAF4EA] p-3.5 rounded-2xl border border-[#EADFCB]">
              <div className="w-11 h-11 rounded-full bg-[#F0ECFA] border border-[#8B72C9]/30 flex items-center justify-center text-xl shadow-xs shrink-0">
                {recentBadge ? (() => {
                  const Icon = BADGE_ICONS[recentBadge.iconType];
                  return <Icon className="w-5 h-5 text-[#8B72C9]" />;
                })() : (
                  <Award className="w-5 h-5 text-[#998D85]" />
                )}
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

      {/* Phase 4 — Recent Rivals: one-tap rematches with real opponents.
          Renders nothing until you've finished at least one duel. */}
      <RecentRivals rivals={recentOpponents} onChallenge={onChallengeRival} />

      {/* Shop + Collection Quick Links */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -1 }}
          className="bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#F2B84B]/50 rounded-[24px] p-4 flex items-center justify-between shadow-[0_2px_12px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(242,184,75,0.12)] transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('shop')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF3D6] border border-[#F2C974] flex items-center justify-center text-[#F2B84B] shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-logo font-bold text-sm text-[#3D342F]">Sticker Shop</h4>
              <p className="text-xs text-[#6F625B] font-display">Spend coins on fun stickers & mascot items!</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#A69485] shrink-0" />
        </motion.div>

        <motion.div
          whileHover={{ y: -1 }}
          className="bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#8B72C9]/50 rounded-[24px] p-4 flex items-center justify-between shadow-[0_2px_12px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(139,114,201,0.12)] transition-all duration-200 cursor-pointer"
          onClick={() => onNavigate('collection')}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0ECFA] border border-[#E0D8F5] flex items-center justify-center text-[#8B72C9] shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-logo font-bold text-sm text-[#3D342F]">Sticker Book</h4>
              <p className="text-xs text-[#6F625B] font-display">{ownedStickerCount} stickers collected so far</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#A69485] shrink-0" />
        </motion.div>
      </div>

      {/* Leaderboards Quick Link */}
      <motion.div
        className="mt-6 p-4 sm:p-5 bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#65B9E8]/50 rounded-[24px] flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_2px_12px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(101,185,232,0.12)] transition-all duration-200 group"
        whileHover={{ y: -1 }}
      >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#E7F5FC] border border-[#D0ECFA] flex items-center justify-center text-[#65B9E8] shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="font-logo font-bold text-sm text-[#3D342F]">Solver Standings</h4>
              <p className="text-xs text-[#6F625B] font-display">Local standings by coin pouch size. Solve and win to climb — live rankings arrive with the backend.</p>
            </div>
          </div>
        <motion.button
          onClick={() => onNavigate('leaderboard')}
          whileTap={{ scale: 0.96 }}
          className="w-full sm:w-auto px-4 py-3 text-xs font-display font-extrabold text-[#388FBF] bg-[#E7F5FC] hover:bg-[#D4EFEF] border border-[#D0ECFA] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
        >
          View Rankings <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </motion.div>

    </div>
  );
}