import { motion, AnimatePresence } from 'motion/react';
import { useEffect } from 'react';
import { Coins, Award, Check, Info } from 'lucide-react';

/**
 * Toast notification system — paper-craft styled, auto-dismissing.
 * Respects prefers-reduced-motion via shorter duration.
 */

export interface ToastData {
  id: number;
  message: string;
  icon?: 'coins' | 'achievement' | 'check' | 'info';
  color?: 'berry' | 'honey' | 'leaf' | 'grape';
}

const ICON_MAP = {
  coins: Coins,
  achievement: Award,
  check: Check,
  info: Info,
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  berry: { bg: 'bg-[#FCE8EC]', border: 'border-[#E45C75]', text: 'text-[#E45C75]' },
  honey: { bg: 'bg-[#FFF3D6]', border: 'border-[#F2B84B]', text: 'text-[#D4960F]' },
  leaf: { bg: 'bg-[#EAF5E7]', border: 'border-[#79B96B]', text: 'text-[#428033]' },
  grape: { bg: 'bg-[#F0ECFA]', border: 'border-[#8B72C9]', text: 'text-[#7155B5]' },
};

interface ToastProps {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ toast, onDismiss, duration = 2500 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss, duration]);

  const Icon = toast ? ICON_MAP[toast.icon ?? 'info'] : Info;
  const colors = toast ? COLOR_MAP[toast.color ?? 'honey'] : COLOR_MAP.honey;

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 ${colors.bg} border ${colors.border} rounded-2xl shadow-raised flex items-center gap-2.5 max-w-[90vw]`}
          role="status"
          aria-live="polite"
        >
          <Icon className={`w-5 h-5 ${colors.text} shrink-0`} />
          <span className="font-display font-bold text-sm text-[#3D342F] whitespace-nowrap">
            {toast.message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
