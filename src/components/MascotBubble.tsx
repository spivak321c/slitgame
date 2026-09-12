import { motion, AnimatePresence } from 'motion/react';
import type { Key } from 'react';
import type { MascotMood } from '../types';

/**
 * MascotBubble — "Slit" the fox.
 *
 * SVG-based fox face with mood-driven expressions + speech bubble.
 * Evolves appearance based on player level (star at L5+, crown at L7+).
 * Wears equipped cosmetics from the shop (glasses, hat, bow tie).
 * Respects prefers-reduced-motion (bounce disabled).
 */

interface MascotBubbleProps {
  mood?: MascotMood;
  message?: string | null;
  level: number;
  equippedItem?: string | null;
  /** Compact mode — smaller fox, no bubble (for in-game reactions). */
  compact?: boolean;
}

// ── SVG fox face ─────────────────────────────────────────────────────

function FoxFace({
  mood,
  level,
  equippedItem,
  size = 80,
}: {
  mood: MascotMood;
  level: number;
  equippedItem?: string | null;
  size?: number;
}) {
  // Eye shapes vary by mood
  const eyes = (() => {
    switch (mood) {
      case 'excited':
        return (
          <>
            <circle cx="46" cy="52" r="5" fill="#fff" stroke="#3D342F" strokeWidth="1.5" />
            <circle cx="74" cy="52" r="5" fill="#fff" stroke="#3D342F" strokeWidth="1.5" />
            <circle cx="47" cy="53" r="2.5" fill="#3D342F" />
            <circle cx="75" cy="53" r="2.5" fill="#3D342F" />
          </>
        );
      case 'celebrate':
        return (
          <>
            <path d="M42,52 Q46,48 50,52" stroke="#3D342F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M70,52 Q74,48 78,52" stroke="#3D342F" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'encourage':
        return (
          <>
            <circle cx="46" cy="52" r="3.5" fill="#3D342F" />
            <circle cx="74" cy="52" r="3.5" fill="#3D342F" />
            <path d="M44,48 Q46,46 48,48" stroke="#3D342F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      case 'think':
        return (
          <>
            <circle cx="46" cy="53" r="3.5" fill="#3D342F" />
            <circle cx="74" cy="51" r="3.5" fill="#3D342F" />
            <path d="M72,46 L80,44" stroke="#3D342F" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </>
        );
      default: // idle, happy
        return (
          <>
            <circle cx="46" cy="52" r="3.5" fill="#3D342F" />
            <circle cx="74" cy="52" r="3.5" fill="#3D342F" />
            <circle cx="47" cy="51" r="1.2" fill="#fff" />
            <circle cx="75" cy="51" r="1.2" fill="#fff" />
          </>
        );
    }
  })();

  // Mouth shapes vary by mood
  const mouth = (() => {
    switch (mood) {
      case 'excited':
      case 'celebrate':
        return <path d="M50,72 Q60,82 70,72 Q60,78 50,72" fill="#3D342F" />;
      case 'happy':
        return <path d="M52,72 Q60,78 68,72" stroke="#3D342F" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
      case 'encourage':
        return <path d="M53,73 Q60,76 67,73" stroke="#3D342F" strokeWidth="2" fill="none" strokeLinecap="round" />;
      case 'think':
        return <path d="M55,74 Q60,72 65,74" stroke="#3D342F" strokeWidth="2" fill="none" strokeLinecap="round" />;
      default:
        return <path d="M55,73 Q60,75 65,73" stroke="#3D342F" strokeWidth="2" fill="none" strokeLinecap="round" />;
    }
  })();

  // Level-based evolution: L5+ gets a small star, L7+ gets a crown
  const levelAccessory = (() => {
    if (level >= 7) {
      return (
        <g transform="translate(60, 14)">
          <path d="M-8,0 L-5,-8 L0,-3 L5,-8 L8,0 L5,3 L-5,3 Z" fill="#F2B84B" stroke="#D4960F" strokeWidth="1" />
        </g>
      );
    }
    if (level >= 5) {
      return (
        <g transform="translate(85, 28)">
          <path d="M0,-4 L1.2,-1.2 L4,-1 L1.8,1 L2.5,4 L0,2.2 L-2.5,4 L-1.8,1 L-4,-1 L-1.2,-1.2 Z" fill="#F2B84B" />
        </g>
      );
    }
    return null;
  })();

  // Equipped shop cosmetics
  const cosmetic = (() => {
    if (equippedItem === 'mascot-glasses') {
      return (
        <g>
          <circle cx="46" cy="52" r="7" fill="none" stroke="#3D342F" strokeWidth="2" />
          <circle cx="74" cy="52" r="7" fill="none" stroke="#3D342F" strokeWidth="2" />
          <line x1="53" y1="52" x2="67" y2="52" stroke="#3D342F" strokeWidth="2" />
        </g>
      );
    }
    if (equippedItem === 'mascot-hat') {
      return (
        <g transform="translate(60, 16)">
          <rect x="-12" y="-4" width="24" height="4" rx="2" fill="#3D342F" />
          <rect x="-9" y="-16" width="18" height="14" rx="2" fill="#3D342F" />
          <rect x="-9" y="-8" width="18" height="3" fill="#E45C75" />
        </g>
      );
    }
    if (equippedItem === 'mascot-bow') {
      return (
        <g transform="translate(60, 82)">
          <path d="M-8,-3 L-2,0 L-8,3 Z" fill="#E45C75" />
          <path d="M8,-3 L2,0 L8,3 Z" fill="#E45C75" />
          <circle cx="0" cy="0" r="2" fill="#C94360" />
        </g>
      );
    }
    return null;
  })();

  // Level 7+ fox gets golden-tinted fur
  const furColor = level >= 7 ? '#F5A04A' : '#E89456';
  const earInner = level >= 5 ? '#FFD8A8' : '#F5C9A0';

  return (
    <svg viewBox="0 0 120 100" width={size} height={size * 0.83} style={{ overflow: 'visible' }}>
      {/* Ears */}
      <path d="M22,38 L28,8 L44,28 Z" fill={furColor} />
      <path d="M98,38 L92,8 L76,28 Z" fill={furColor} />
      <path d="M26,34 L30,16 L39,27 Z" fill={earInner} />
      <path d="M94,34 L90,16 L81,27 Z" fill={earInner} />

      {/* Head */}
      <ellipse cx="60" cy="52" rx="36" ry="32" fill={furColor} />

      {/* Cream face mask */}
      <ellipse cx="60" cy="58" rx="24" ry="22" fill="#FFF5EB" />

      {/* Cheek blush for happy/celebrate */}
      {(mood === 'happy' || mood === 'celebrate' || mood === 'excited') && (
        <>
          <circle cx="36" cy="62" r="4" fill="#FFB8C5" opacity="0.6" />
          <circle cx="84" cy="62" r="4" fill="#FFB8C5" opacity="0.6" />
        </>
      )}

      {eyes}
      {mouth}
      {/* Nose */}
      <ellipse cx="60" cy="64" rx="3.5" ry="2.5" fill="#3D342F" />

      {cosmetic}
      {levelAccessory}
    </svg>
  );
}

// ── Speech bubble ────────────────────────────────────────────────────

function SpeechBubble({ message }: { message: string; key?: Key }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="relative bg-white border-2 border-[#E7DCCB] rounded-2xl px-4 py-2.5 shadow-card max-w-[220px]"
    >
      {/* Tail */}
      <div className="absolute -bottom-2 left-6 w-3 h-3 bg-white border-r-2 border-b-2 border-[#E7DCCB] rotate-45" />
      <p className="font-display font-bold text-sm text-[#3D342F] leading-snug">
        {message}
      </p>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────

export default function MascotBubble({
  mood = 'idle',
  message,
  level,
  equippedItem,
  compact = false,
}: MascotBubbleProps) {
  const bounce = mood === 'celebrate' || mood === 'excited';

  return (
    <div className={`flex items-end gap-2 ${compact ? 'scale-90' : ''}`}>
      <motion.div
        animate={bounce ? { y: [0, -6, 0] } : { y: 0 }}
        transition={bounce ? { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } : {}}
        className="shrink-0"
      >
        <FoxFace mood={mood} level={level} equippedItem={equippedItem} size={compact ? 56 : 80} />
      </motion.div>
      <AnimatePresence mode="wait">
        {message && !compact && (
          <SpeechBubble key={message} message={message} />
        )}
      </AnimatePresence>
    </div>
  );
}
