import { motion } from 'motion/react';
import { Trophy, Award, ArrowRight, Play, Users, TrendingUp, Zap, Coins, Gamepad2, Swords } from 'lucide-react';
import { ScreenType, Achievement, PlayerProfile, levelFromXp, levelTitle } from '../types';
import RivalsStrip from './RivalsStrip';
import { DuelRoom } from '../data/duelRooms';

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
  openRooms: DuelRoom[];
  waitingRooms: number;
  onJoinRoom: (room: DuelRoom) => void;
}

export default function DashboardView({ onNavigate, profile, achievements, openRooms, waitingRooms, onJoinRoom }: DashboardViewProps) {
  // Find a locked and an unlocked achievement
  const recentBadge = achievements.find(a => a.unlocked) || achievements[1];
  const level = levelFromXp(profile.xp);
  const solvedCount = profile.gamesWon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      {/* Friendly Top Welcome */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] tracking-tight">
            Welcome back, {profile.username}!
          </h1>
          <p className="text-[#6F625B] font-display text-sm md:text-base mt-1">
            Your puzzle workshop is open and warm. Ready for some words?
          </p>
        </div>
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
              <h3 className="text-xl font-logo font-extrabold text-[#3D342F]">Duel Matches</h3>
              {waitingRooms > 0 ? (
                <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#428033] bg-[#EAF5E7] border border-[#BFE3C9] px-2.5 py-1 rounded-full">
                  <Swords className="w-3 h-3" />
                  {waitingRooms} {waitingRooms === 1 ? 'room' : 'rooms'} waiting
                </span>
              ) : null}
            </div>

            <p className="text-sm text-[#6F625B] font-display leading-relaxed mb-5">
              Step into a head-to-head match against a clever practice rival. Winner takes the coin prize pool — the pot grows bigger as you risk more. Live opponents arrive with the upcoming backend.
            </p>

            {openRooms.length > 0 ? (
              <div className="flex flex-col gap-2 mb-5">
                {openRooms.map(room => (
                  <div
                    key={room.id}
                    className="flex items-center justify-between gap-3 bg-white border border-[#E7DCCB] rounded-2xl px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-[#FAF4EA] border border-[#EADFCB] grid place-items-center text-lg shrink-0">
                        {room.host.avatar}
                      </span>
                      <div className="min-w-0">
                        <div className="font-mono text-[11px] font-semibold text-[#4E433C] truncate">
                          <span className="inline-flex items-center gap-1">{room.stake}<Coins className="w-3 h-3 text-[#F2B84B]" /></span> stake · {room.minutes} min
                        </div>
                        <div className="text-[10.5px] text-[#998D85] truncate">
                          {room.handle} · {room.slices}/{room.sliceTotal} slices
                        </div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => onJoinRoom(room)}
                      whileTap={{ scale: 0.94 }}
                      className="px-4 py-1.5 bg-[#FDECE7] hover:bg-[#FCD8CD] border border-[#FADCD5] text-[#D96B4C] font-display font-extrabold text-[11px] rounded-full transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Join
                    </motion.button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-5 p-3.5 bg-[#FAF4EA] border border-dashed border-[#DCCFB8] rounded-2xl">
                <Swords className="w-5 h-5 text-[#A69485] shrink-0" />
                <p className="text-xs text-[#6F625B] font-display">
                  No open staked rooms right now. Pick a rival below to start your own, or open the Duel Arena.
                </p>
              </div>
            )}
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

      {/* Active Word Rivals Strip */}
      <motion.div
        className="mt-6 p-4 sm:p-5 bg-[#FFFCF7] border border-[#E9DCC6] hover:border-[#F28C6F]/50 rounded-[24px] shadow-[0_2px_12px_-4px_rgba(61,52,47,0.04)] hover:shadow-[0_6px_20px_-4px_rgba(242,140,111,0.12)] transition-all duration-200"
        whileHover={{ y: -1 }}
      >
        <RivalsStrip onDuel={() => onNavigate('duel')} />
      </motion.div>

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
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-display font-extrabold text-[#388FBF] bg-[#E7F5FC] hover:bg-[#D4EFEF] border border-[#D0ECFA] rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
        >
          View Rankings <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </motion.button>
      </motion.div>

    </div>
  );
}