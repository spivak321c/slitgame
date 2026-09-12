import { motion } from 'motion/react';

/**
 * Reusable paper-craft progress bar with spring animation.
 * Used for XP, quest progress, streak progress, etc.
 */

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  color?: string;
  height?: string;
  showText?: boolean;
}

export default function ProgressBar({
  value,
  max,
  label,
  color = 'bg-[#8B72C9]',
  height = 'h-3',
  showText = false,
}: ProgressBarProps) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);

  return (
    <div className="w-full">
      {(label || showText) && (
        <div className="flex justify-between text-[11px] font-display font-bold text-[#6F625B] mb-1.5">
          <span>{label}</span>
          {showText && (
            <span className="font-mono text-[#3D342F]">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className={`${height} bg-[#F4EBDD] border border-[#EADFCB] rounded-full overflow-hidden`}>
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
    </div>
  );
}
