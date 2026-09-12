import { motion, type Variants } from 'motion/react';
import type { ReactNode } from 'react';

/**
 * Reusable juicy button with squash-and-stretch spring physics.
 * Guarantees ≥48px touch target (accessibility).
 * Respects prefers-reduced-motion via Framer Motion's built-in handling.
 */

type Variant = 'primary' | 'secondary' | 'success' | 'ghost';

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    'bg-[#E45C75] hover:bg-[#D34B64] text-white shadow-[0_3px_0_#AF324B,0_6px_14px_-4px_rgba(228,92,117,0.3)]',
  secondary:
    'bg-[#F2B84B] hover:bg-[#E5A92F] text-white shadow-[0_3px_0_#C49125,0_6px_14px_-4px_rgba(242,184,75,0.3)]',
  success:
    'bg-[#79B96B] hover:bg-[#6AA85C] text-white shadow-[0_3px_0_#5A8E4D,0_6px_14px_-4px_rgba(121,185,107,0.3)]',
  ghost:
    'bg-[#FAF4EA] hover:bg-[#E7DCCB] text-[#3D342F] border border-[#EADFCB] shadow-xs',
};

const tapVariants: Variants = {
  idle: { scale: 1, y: 0 },
  pressed: { scale: 0.94, y: 2 },
};

interface JuicyButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
  ariaLabel?: string;
}

export default function JuicyButton({
  children,
  onClick,
  variant = 'primary',
  className = '',
  disabled = false,
  icon,
  fullWidth = false,
  ariaLabel,
}: JuicyButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      variants={tapVariants}
      initial="idle"
      whileTap={disabled ? undefined : 'pressed'}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      className={`inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] font-display font-bold text-sm rounded-2xl transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${VARIANT_STYLES[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {icon}
      {children}
    </motion.button>
  );
}
