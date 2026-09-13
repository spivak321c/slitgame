import { motion } from 'motion/react';
import { Check, Gamepad2, Swords, Coins, Keyboard } from 'lucide-react';
import type { Key } from 'react';
import ProgressBar from './ProgressBar';
import type { Quest } from '../types';

/**
 * QuestCard — daily quest with progress bar + claim button.
 * Positive-only framing: shows progress, not failure.
 */

interface QuestCardProps {
  quest: Quest;
  onClaim: (questId: string) => void;
  key?: Key;
}

const QUEST_ICONS: Record<string, typeof Gamepad2> = {
  gamepad: Gamepad2,
  swords: Swords,
  letters: Keyboard,
};

export default function QuestCard({ quest, onClaim }: QuestCardProps) {
  const complete = quest.progress >= quest.goal;
  const QuestIcon = QUEST_ICONS[quest.icon] ?? Gamepad2;

  return (
    <div
      className={`rounded-2xl p-4 border-2 transition-all ${
        quest.claimed
          ? 'bg-[#EAF5E7] border-[#BFE3C9] opacity-60'
          : complete
          ? 'bg-[#FFF3D6] border-[#F2C974]'
          : 'bg-[#FFFCF7] border-[#E7DCCB]'
      }`}
    >
      <div className="flex items-center gap-3 mb-2.5">
        <span className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 ${
          quest.claimed
            ? 'bg-[#EAF5E7] border-[#BFE3C9] text-[#79B96B]'
            : complete
            ? 'bg-[#FFF3D6] border-[#F2C974] text-[#D4960F]'
            : 'bg-[#FAF4EA] border-[#EADFCB] text-[#A69485]'
        }`}>
          <QuestIcon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <h4 className="font-logo font-bold text-xs text-[#3D342F]">
            {quest.title}
          </h4>
          <p className="text-[10px] text-[#998D85] font-display">
            {quest.description}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-mono font-bold text-[#D4960F]">+{quest.reward}</span>
          <Coins className="w-3.5 h-3.5 text-[#F2B84B]" />
        </div>
      </div>

      <ProgressBar
        value={Math.min(quest.progress, quest.goal)}
        max={quest.goal}
        color={complete ? 'bg-[#F2B84B]' : 'bg-[#79B96B]'}
        height="h-2.5"
        showText
      />

      {quest.claimed ? (
        <div className="mt-2 flex items-center justify-center gap-1.5 py-1.5 text-[#79B96B]">
          <Check className="w-3.5 h-3.5" />
          <span className="text-[10px] font-display font-bold">Claimed!</span>
        </div>
      ) : complete ? (
        <motion.button
          onClick={() => onClaim(quest.id)}
          whileTap={{ scale: 0.94 }}
          className="mt-2 w-full py-2 bg-[#79B96B] hover:bg-[#6AA85C] text-white font-display font-bold text-[11px] rounded-lg shadow-[0_2px_0_#5A8E4D] transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px]"
        >
          <Check className="w-3.5 h-3.5" />
          Claim Reward
        </motion.button>
      ) : null}
    </div>
  );
}
