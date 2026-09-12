import { motion, AnimatePresence } from 'motion/react';
import { Coins } from 'lucide-react';

/**
 * CoinFly — coins animate from a source point to the pouch button,
 * creating the juicy "earn coins" feedback loop.
 * Finds the pouch button by ID to get the target position.
 */

export interface CoinFlyData {
  id: number;
  amount: number;
  /** Origin coordinates (percentage of viewport). */
  fromX: number;
  fromY: number;
}

interface CoinFlyProps {
  data: CoinFlyData | null;
  onDone: () => void;
}

export default function CoinFly({ data, onDone }: CoinFlyProps) {
  const getTarget = () => {
    const pouch = document.getElementById('coin-pouch-btn');
    if (!pouch) return { x: 90, y: 5 };
    const rect = pouch.getBoundingClientRect();
    return {
      x: (rect.left + rect.width / 2) / window.innerWidth * 100,
      y: (rect.top + rect.height / 2) / window.innerHeight * 100,
    };
  };

  const target = data ? getTarget() : { x: 90, y: 5 };
  const coinCount = data ? Math.min(data.amount, 8) : 0;

  return (
    <AnimatePresence onExitComplete={onDone}>
      {data && (
        <div className="fixed inset-0 pointer-events-none z-[55] overflow-hidden">
          {Array.from({ length: coinCount }).map((_, i) => (
            <motion.div
              key={`${data.id}-${i}`}
              className="absolute"
              style={{ left: `${data.fromX}%`, top: `${data.fromY}%` }}
              initial={{ opacity: 1, scale: 0.5, x: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [1, 1, 0],
                scale: [0.5, 1, 0.8],
                x: [
                  0,
                  (Math.random() - 0.5) * 60,
                  (target.x - data.fromX) * window.innerWidth / 100,
                ],
                y: [
                  0,
                  -40 - Math.random() * 30,
                  (target.y - data.fromY) * window.innerHeight / 100,
                ],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 0.8,
                delay: i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <div className="w-7 h-7 rounded-full bg-[#F2B84B] border-2 border-[#D4960F] flex items-center justify-center shadow-md">
                <Coins className="w-4 h-4 text-[#FFF3D6]" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
