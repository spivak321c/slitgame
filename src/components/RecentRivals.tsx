import { motion } from 'motion/react';
import { Swords, Users, User } from 'lucide-react';
import type { RecentOpponent } from '../lib/duelTypes';
import { DIFFICULTIES, type Difficulty } from '../types';
import { sound } from '../utils/audio';

interface RecentRivalsProps {
  rivals: RecentOpponent[];
  onChallenge: (difficulty: Difficulty) => void;
}

const DIFF_LABEL: Record<string, string> = {
  easy: 'Quick',
  classic: 'Classic',
  hard: 'Grand',
};

/**
 * Phase 4 — "Recent Rivals" strip. Real data: the rivals come from the
 * `recent_opponents` Supabase RPC (finished duels you belong to), cached
 * locally so the strip still renders offline. Tap a rival to start a new
 * duel at the same difficulty.
 */
export default function RecentRivals({ rivals, onChallenge }: RecentRivalsProps) {
  if (rivals.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-2.5">
        <Users className="w-4 h-4 text-[#F28C6F]" />
        <h3 className="font-logo font-extrabold text-sm text-[#3D342F]">Recent Rivals</h3>
        <span className="text-[10px] text-[#998D85] font-mono ml-auto">
          {rivals.length} {rivals.length === 1 ? 'duel' : 'duels'} so far
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1.5 -mx-1 px-1">
        {rivals.map(rival => {
          const difficulty = DIFFICULTIES.find(d => d.id === rival.difficulty);
          const label = DIFF_LABEL[rival.difficulty] ?? 'Classic';
          return (
            <motion.button
              key={rival.opponentId}
              onClick={() => {
                sound.playKeyPress();
                onChallenge(rival.difficulty);
              }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 flex items-center gap-2.5 pl-2 pr-3 py-2 bg-[#FFFCF7] border border-[#E7DCCB] hover:border-[#F28C6F] rounded-2xl transition-colors cursor-pointer min-h-[52px]"
              aria-label={`Rematch ${rival.username} at ${label} difficulty`}
            >
              <span className="w-9 h-9 rounded-full bg-white border border-[#E7DCCB] grid place-items-center text-base select-none shrink-0">
                {rival.avatar ? (
                  rival.avatar
                ) : (
                  <User className="w-4 h-4 text-[#A69485]" />
                )}
              </span>
              <span className="text-left min-w-0">
                <span className="block font-logo font-bold text-xs text-[#3D342F] truncate max-w-[110px]">
                  {rival.username}
                </span>
                <span className="block text-[10px] font-mono font-semibold text-[#998D85] mt-0.5">
                  {label} · {difficulty?.wordLength ?? 5} letters
                </span>
              </span>
              <Swords className="w-3.5 h-3.5 text-[#F28C6F] shrink-0" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}