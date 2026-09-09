import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Swords } from 'lucide-react';
import { OPPONENTS } from '../types';

export interface Rival {
  avatar: string;
  handle: string;
  name: string;
}

const RIVALS: Rival[] = OPPONENTS.map(o => ({
  avatar: o.avatar,
  handle: `@${o.id}`,
  name: o.name,
}));

interface RivalsStripProps {
  onDuel: (rival: Rival) => void;
}

export default function RivalsStrip({ onDuel }: RivalsStripProps) {
  const [challenged, setChallenged] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const handleDuel = (rival: Rival) => {
    setChallenged(rival.handle);
    setTimeout(() => setChallenged(null), 1400);
    onDuel(rival);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2.5">
        <span className="flex items-center gap-1.5 font-logo font-extrabold text-[12.5px] text-[#3D342F]">
          <Swords className="w-4 h-4 text-[#F28C6F]" />
          Practice Rivals
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-[#998D85]">
          <motion.span
            className="w-2 h-2 rounded-full bg-[#8B72C9] inline-block"
            animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          {RIVALS.length} rivals ready
        </span>
      </div>

      <div className="flex gap-2.5 overflow-x-auto pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {RIVALS.map((rival) => (
          <div
            key={rival.handle}
            className="flex items-center gap-2.5 bg-[#FAF4EA] border border-[#EADFCB] rounded-2xl px-3 py-2.5 flex-shrink-0"
          >
            <span className="w-9 h-9 rounded-xl bg-white border border-[#E7DCCB] grid place-items-center text-[19px] shadow-xs">
              {rival.avatar}
            </span>
            <div>
              <div className="font-logo font-extrabold text-[11.5px] text-[#3D342F] leading-tight">
                {rival.name}
              </div>
              <div className="font-mono text-[9.5px] text-[#6F625B] font-semibold">
                {rival.handle}
              </div>
            </div>
            <motion.button
              onClick={() => handleDuel(rival)}
              whileTap={{ scale: 0.93 }}
              className="ml-1 px-3.5 py-1.5 rounded-full bg-[#FDECE7] hover:bg-[#FCD8CD] border border-[#FADCD5] text-[#D96B4C] font-display font-extrabold text-[11px] transition-colors whitespace-nowrap cursor-pointer"
            >
              {challenged === rival.handle ? '✓ challenged' : 'Challenge'}
            </motion.button>
          </div>
        ))}
      </div>
    </div>
  );
}
