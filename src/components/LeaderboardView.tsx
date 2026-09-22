import { motion } from 'motion/react';
import { ScrollText, ArrowLeft, Medal, Coins, Trophy, Gamepad2, Swords, Users } from 'lucide-react';
import { ScreenType, PlayerProfile, levelFromXp, levelTitle } from '../types';

interface LeaderboardViewProps {
  onNavigate: (screen: ScreenType) => void;
  profile: PlayerProfile;
}

export default function LeaderboardView({ onNavigate, profile }: LeaderboardViewProps) {
  const playerLevel = levelFromXp(profile.xp).level;

  const hasPlayed = profile.gamesPlayed > 0 || profile.duelsPlayed > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">

      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E7DCCB]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 -ml-1 px-2.5 py-2.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <span className="text-xs text-[#998D85] font-mono">Local Standings</span>
      </div>

      <div className="text-center max-w-lg mx-auto mb-8">
        <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] mb-2">
          Solver Standings
        </h1>
        <p className="text-sm text-[#6F625B]">
          Rank by coin pouch size. Solve puzzles and win duels to climb the board.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl p-4 mb-6 shadow-card flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-[#FDECE7] border border-[#FADCD5] grid place-items-center shrink-0">
          <Users className="w-5 h-5 text-[#F28C6F]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-bold text-[#3D342F]">Challenge a friend</p>
          <p className="text-xs text-[#6F625B] leading-relaxed">Share a room code and duel a real player 1-on-1. No bots, just fun.</p>
        </div>
        <motion.button
          onClick={() => onNavigate('duel')}
          whileTap={{ scale: 0.94 }}
          className="px-4 py-3 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_2px_0_#AF324B] transition-all cursor-pointer whitespace-nowrap"
        >
          New duel
        </motion.button>
      </motion.div>

      <div className="bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl overflow-hidden shadow-card p-2 mb-8">
        {hasPlayed ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-[#FFF3D6] border-[#F2B84B]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white border border-[#E7DCCB] flex items-center justify-center text-sm shadow-sm font-logo font-extrabold text-[#3D342F]">
                  <Medal className="w-4 h-4 text-[#F2B84B]" strokeWidth={2.25} />
                </div>
                <div className="text-left">
                  <div className="font-logo font-extrabold text-[#3D342F] flex items-center gap-1.5">
                    You ({profile.username})
                    <span className="px-2 py-0.5 bg-[#E45C75] text-white text-[9px] rounded-full uppercase tracking-wider font-display font-bold">
                      You
                    </span>
                  </div>
                  <div className="text-xs text-[#6F625B] font-display font-medium">
                    {levelTitle(playerLevel)}
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-5">
                <div className="text-xs text-[#6F625B]">
                  <div className="font-logo font-extrabold text-sm text-[#3D342F] flex items-center justify-end gap-1">
                    <Coins className="w-3.5 h-3.5 text-[#F2B84B]" />
                    {profile.coins}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <Trophy className="w-3 h-3 text-[#65B9E8]" />
                    {profile.gamesWon} solved
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-3">
            <Trophy className="w-7 h-7 text-[#998D85] mx-auto opacity-50" />
            <p className="text-xs text-[#6F625B] max-w-sm mx-auto">
              Live solver rankings arrive with the upcoming server backend. For now your
              standings are <strong className="text-[#3D342F]">local-only</strong> — play
              a puzzle or duel to claim your first rank.
            </p>
            <button
              onClick={() => onNavigate('play')}
              className="px-4 py-3 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_2px_0_#AF324B] transition-all cursor-pointer"
            >
              Play your first puzzle
            </button>
          </div>
        )}
      </div>

      <div className="bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl p-5 text-left text-xs leading-relaxed text-[#6F625B]">
        <h3 className="font-logo font-bold text-sm text-[#3D342F] mb-2 flex items-center gap-1">
          <ScrollText className="w-4 h-4 text-[#F2B84B]" />
          Ranking Rules
        </h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Rankings are sorted by coins in each solver's pouch.</li>
          <li>Win live duels against friends to earn coins and jump up the board.</li>
          <li>Every solve and duel also earns XP toward your level title.</li>
          <li>Coins are purely for fun — no real money involved, ever.</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl p-4 text-center">
          <Gamepad2 className="w-4 h-4 text-[#E45C75] mx-auto mb-1.5" />
          <div className="font-logo font-black text-lg text-[#3D342F]">{profile.gamesWon}</div>
          <div className="text-[10px] font-mono text-[#998D85] uppercase tracking-wide">Your solves</div>
        </div>
        <div className="bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl p-4 text-center">
          <Swords className="w-4 h-4 text-[#F28C6F] mx-auto mb-1.5" />
          <div className="font-logo font-black text-lg text-[#3D342F]">{profile.duelsWon}</div>
          <div className="text-[10px] font-mono text-[#998D85] uppercase tracking-wide">Duel wins</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-4 text-[10.5px] font-mono text-[#998D85]">
        Lv {playerLevel} · {levelTitle(playerLevel)}
      </div>
    </div>
  );
}
