import { motion, AnimatePresence } from 'motion/react';
import { PartyPopper, Gift, Heart } from 'lucide-react';

/**
 * StarBurst — confetti star burst overlay for celebrations.
 * Enhances the existing star celebration with paper-craft stickers.
 * Each burst uses a unique id so AnimatePresence can track it.
 */

export interface StarBurstData {
  id: number;
  /** Number of particles. */
  count?: number;
}

interface StarBurstProps {
  data: StarBurstData | null;
  onDone: () => void;
}

const ICONS = [PartyPopper, Gift, Heart, PartyPopper];
const COLORS = ['#E45C75', '#F2B84B', '#79B96B', '#65B9E8', '#8B72C9', '#F28C6F'];

export default function StarBurst({ data, onDone }: StarBurstProps) {
  const count = data?.count ?? 12;
  const particles = data
    ? Array.from({ length: count }).map((_, i) => ({
        id: `${data.id}-${i}`,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 50,
        color: COLORS[i % COLORS.length],
        Icon: ICONS[i % ICONS.length],
        delay: Math.random() * 0.15,
        rotate: (Math.random() - 0.5) * 60,
      }))
    : [];

  return (
    <AnimatePresence onExitComplete={onDone}>
      {data && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {particles.map((p) => {
            const Icon = p.Icon;
            return (
              <motion.div
                key={p.id}
                className="absolute"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                initial={{ opacity: 0, scale: 0.1, y: 30, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0.2, 1.2, 1, 0.4],
                  y: -60,
                  rotate: [0, p.rotate, p.rotate * 1.5, p.rotate * 2],
                }}
                transition={{
                  duration: 2.2,
                  delay: p.delay,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                <Icon
                  className="w-7 h-7"
                  style={{ color: p.color }}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}
