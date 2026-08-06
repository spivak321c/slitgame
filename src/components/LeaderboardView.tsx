import { Star, Trophy, Award, ArrowLeft } from 'lucide-react';
import { ScreenType } from '../types';

interface LeaderboardViewProps {
  onNavigate: (screen: ScreenType) => void;
  playerSolved: boolean;
  playerAttempts: number;
}

export default function LeaderboardView({ onNavigate, playerSolved, playerAttempts }: LeaderboardViewProps) {
  // Static mock entries that feel like a friendly school tournament board
  const baseEntries = [
    {
      rank: 1,
      name: 'Clara Cleanwood 🦉',
      level: 'Word Explorer',
      attempts: 3,
      speed: '82 seconds',
      badge: 'Golden Stack',
      isPlayer: false,
    },
    {
      rank: 2,
      name: 'Wordsmith Wendy 🐨',
      level: 'Pattern Finder',
      attempts: 3,
      speed: '96 seconds',
      badge: 'True Detective',
      isPlayer: false,
    },
    {
      rank: 3,
      name: 'Gary the Fox 🦊',
      level: 'Letter Learner',
      attempts: 4,
      speed: '124 seconds',
      badge: 'Paper Chain',
      isPlayer: false,
    },
    {
      rank: 4,
      name: 'Squirrel Sammy 🐿️',
      level: 'Guesser',
      attempts: 5,
      speed: '142 seconds',
      badge: 'Puzzle Solver',
      isPlayer: false,
    },
  ];

  // Insert player if they completed the puzzle
  let listToDisplay = [...baseEntries];
  if (playerSolved) {
    const playerEntry = {
      rank: playerAttempts <= 3 ? 2 : playerAttempts === 4 ? 3 : 4,
      name: 'You (Solver) 🚀',
      level: 'Pattern Finder',
      attempts: playerAttempts,
      speed: '84 seconds',
      badge: playerAttempts <= 3 ? 'Golden Stack' : 'Secure Sealer',
      isPlayer: true,
    };
    
    // Insert into correct index based on attempts
    listToDisplay.splice(playerEntry.rank - 1, 0, playerEntry);
    
    // Adjust ranks of subsequent rows
    listToDisplay = listToDisplay.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      
      {/* Top Navigation Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E7DCCB]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <span className="text-xs text-[#998D85] font-mono">Today's Standings</span>
      </div>

      {/* Header Info */}
      <div className="text-center max-w-lg mx-auto mb-8">
        <h1 className="text-3xl font-logo font-extrabold text-[#3D342F] mb-2">
          Daily Standings
        </h1>
        <p className="text-sm text-[#6F625B]">
          Earn progress stamps and stars! Rankings are updated once you save your verified solve on-chain.
        </p>
      </div>

      {/* Standings List (Clean Tactile Rows) */}
      <div className="bg-[#FFFCF7] border border-[#E7DCCB] rounded-2xl overflow-hidden shadow-card p-2 mb-8">
        <div className="space-y-1.5">
          
          {listToDisplay.map((entry, index) => {
            const isTop3 = entry.rank <= 3;
            const rankIcon = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '✨';
            
            return (
              <div
                key={index}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  entry.isPlayer
                    ? 'bg-[#FFF3D6] border-[#F2B84B] font-semibold'
                    : index % 2 === 0
                    ? 'bg-[#FFFCF7] border-transparent'
                    : 'bg-[#F4EBDD]/40 border-transparent'
                }`}
              >
                {/* Left Section: Rank + Name */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-[#E7DCCB] flex items-center justify-center text-sm shadow-sm font-logo font-extrabold text-[#3D342F]">
                    {isTop3 ? rankIcon : entry.rank}
                  </div>
                  
                  <div className="text-left">
                    <div className="font-logo font-extrabold text-[#3D342F] flex items-center gap-1.5">
                      {entry.name}
                      {entry.isPlayer && (
                        <span className="px-2 py-0.5 bg-[#E45C75] text-white text-[9px] rounded-full uppercase tracking-wider font-display font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#6F625B] font-display font-medium">
                      {entry.level}
                    </div>
                  </div>
                </div>

                {/* Right Section: Attempts + Speed */}
                <div className="text-right flex items-center gap-6">
                  <div className="text-xs text-[#6F625B]">
                    <div className="font-logo font-extrabold text-sm text-[#3D342F]">
                      {entry.attempts} {entry.attempts === 1 ? 'try' : 'tries'}
                    </div>
                    <div>{entry.speed}</div>
                  </div>

                  {/* Stamp Sticker Meta */}
                  <div className="hidden sm:flex w-10 h-10 rounded-full bg-white border border-[#E7DCCB] items-center justify-center text-xs shadow-sm select-none" title={`Earned ${entry.badge} Badge`}>
                    {entry.badge === 'Golden Stack' ? '📚' : entry.badge === 'True Detective' ? '🔍' : '✉️'}
                  </div>
                </div>

              </div>
            );
          })}

        </div>
      </div>

      {/* Plain Language Ranking Rules */}
      <div className="bg-[#FFF9F0] border border-[#E7DCCB] rounded-2xl p-5 text-left text-xs leading-relaxed text-[#6F625B]">
        <h3 className="font-logo font-bold text-sm text-[#3D342F] mb-2 flex items-center gap-1">
          <Star className="w-4 h-4 text-[#F2B84B] fill-[#F2B84B]" />
          Friendly Ranking Guidelines
        </h3>
        <ul className="list-disc pl-4 space-y-1">
          <li>Rankings are primary sorted by the **fewest guess attempts** required to solve today's hidden word.</li>
          <li>Tiebreaker rules are calculated based on your total elapsed solving time in seconds.</li>
          <li>Connecting your card pouch saves your verified solve as an immortal cryptographic stamp.</li>
        </ul>
      </div>

    </div>
  );
}
