import { motion } from 'motion/react';
import { Gift, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { todayStr } from '../types';

/**
 * ChestCard — daily reward chest with 24h cooldown.
 * Kids' ethics: no FOMO countdown pressure — always positive framing.
 * "Ready!" when available, "Come back tomorrow!" when on cooldown.
 */

interface ChestCardProps {
  lastOpened: string | null;
  onOpen: () => void;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

function timeUntilReset(lastOpened: string | null): number {
  if (!lastOpened) return 0;
  const opened = new Date(lastOpened).getTime();
  const elapsed = Date.now() - opened;
  return Math.max(0, COOLDOWN_MS - elapsed);
}

function formatCountdown(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export default function ChestCard({ lastOpened, onOpen }: ChestCardProps) {
  const [now, setNow] = useState(Date.now());

  // Tick every minute when on cooldown
  useEffect(() => {
    const remaining = timeUntilReset(lastOpened);
    if (remaining <= 0) return;
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, [lastOpened]);

  const remaining = timeUntilReset(lastOpened);
  const ready = remaining <= 0;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-[24px] p-5 border-2 transition-all ${
        ready
          ? 'bg-[#FFF3D6] border-[#F2C974] shadow-[0_4px_20px_-4px_rgba(242,184,75,0.2)]'
          : 'bg-[#FAF4EA] border-[#EADFCB] opacity-75'
      }`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          animate={ready ? { rotate: [0, -5, 5, -3, 0], scale: [1, 1.08, 1] } : {}}
          transition={ready ? { duration: 2, repeat: Infinity, repeatDelay: 1 } : {}}
          className="w-12 h-12 rounded-2xl bg-white/70 border border-[#F2C974] flex items-center justify-center text-2xl shrink-0"
        >
          🎁
        </motion.div>
        <div className="flex-1 min-w-0">
          <h4 className="font-logo font-extrabold text-sm text-[#3D342F]">Daily Chest</h4>
          <p className="text-xs text-[#6F625B] font-display">
            {ready ? 'Tap to open your surprise!' : 'Come back soon for more!'}
          </p>
        </div>
      </div>

      {ready ? (
        <motion.button
          onClick={onOpen}
          whileTap={{ scale: 0.94 }}
          className="mt-3 w-full py-2.5 bg-[#F2B84B] hover:bg-[#E5A92F] text-white font-display font-bold text-xs rounded-xl shadow-[0_2px_0_#C49125] transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
        >
          <Gift className="w-4 h-4" />
          Open Chest!
        </motion.button>
      ) : (
        <div className="mt-3 w-full py-2.5 bg-white/60 border border-[#EADFCB] rounded-xl flex items-center justify-center gap-1.5 text-[#6F625B]">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono text-xs font-bold">{formatCountdown(remaining)}</span>
        </div>
      )}
    </motion.div>
  );
}
