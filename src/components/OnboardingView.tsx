import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Delete,
  Sparkles,
  Lightbulb,
  PartyPopper,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { calculateLetterStates } from '../types';

interface OnboardingViewProps {
  onComplete: (username: string, avatar: string) => void;
}

// ── Step 1 mascot intro uses a static emoji placeholder. The real
//    animated SVG fox mascot ("Slit") lands in Phase 3. ──────────────────
const MASCOT_EMOJI = '🦊';

// ── Step 2 interactive tutorial ────────────────────────────────────────
// The demo word is revealed so kids can focus on learning the colors,
// not on guessing. A pre-filled demo guess teaches all three states,
// then the player types their own guess to try it for real.
const TUTORIAL_WORD = 'STAR';
const DEMO_GUESS = 'SALT';

const AVATAR_OPTIONS = ['🦊', '🐻', '🦉', '🐸', '🐱', '🐶', '🦁', '🐨', '🐼', '🦄'];

const STEP_LABELS = ['Meet Slit', 'How to Play', 'Your Identity'] as const;

type TileState = 'correct' | 'present' | 'absent' | 'empty' | 'current';

const TILE_STYLES: Record<TileState, string> = {
  correct: 'bg-[#79B96B] border-[#5E9A50] text-white',
  present: 'bg-[#F2B84B] border-[#D99B28] text-white',
  absent: 'bg-[#E7DCCB] border-[#D8CBB5] text-[#998D85]',
  empty: 'bg-[#FFFCF7] border-2 border-[#E7DCCB]',
  current: 'bg-[#FFFCF7] border-2 border-[#F2B84B] text-[#3D342F]',
};

const STATE_LABEL: Record<'correct' | 'present' | 'absent', string> = {
  correct: 'Right letter, right spot!',
  present: 'Right letter, wrong spot',
  absent: 'Not in the word',
};

const STATE_ICON: Record<'correct' | 'present' | 'absent', string> = {
  correct: '✓',
  present: '◐',
  absent: '·',
};

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(0);

  const goNext = useCallback(() => {
    sound.playKeyEnter();
    setStep(s => Math.min(s + 1, 2));
  }, []);

  const goBack = useCallback(() => {
    sound.playKeyPress();
    setStep(s => Math.max(s - 1, 0));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <motion.div
              animate={{
                scale: step === i ? 1.15 : 1,
                backgroundColor: step >= i ? '#E45C75' : '#E7DCCB',
              }}
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-logo font-black text-white"
            >
              {step > i ? <Check className="w-3 h-3" /> : i + 1}
            </motion.div>
            <span className={`text-[10px] font-display font-bold ${step >= i ? 'text-[#3D342F]' : 'text-[#A69485]'} hidden sm:inline`}>
              {label}
            </span>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-6 h-0.5 rounded-full ${step > i ? 'bg-[#E45C75]' : 'bg-[#E7DCCB]'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {step === 0 && <Step1Mascot onNext={goNext} />}
          {step === 1 && <Step2Tutorial onNext={goNext} onBack={goBack} />}
          {step === 2 && <Step3Identity onComplete={onComplete} onBack={goBack} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ═══ STEP 1 — Meet the mascot (placeholder) ═══════════════════════════
function Step1Mascot({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center text-center">
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="w-28 h-28 sm:w-32 sm:h-32 rounded-[32px] bg-gradient-to-br from-[#FDECE7] to-[#FCD8CD] border-2 border-[#FADCD5] flex items-center justify-center text-6xl sm:text-7xl shadow-raised mb-6"
      >
        {MASCOT_EMOJI}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-3xl p-5 sm:p-6 shadow-card max-w-md mb-8 relative"
      >
        {/* Speech bubble tail */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FFFCF7] border-l-2 border-t-2 border-[#E7DCCB] rotate-45" />
        <p className="font-logo font-extrabold text-lg text-[#3D342F] mb-2">
          Hi! I'm Slit the fox! 🦊
        </p>
        <p className="text-sm text-[#6F625B] leading-relaxed">
          Welcome to <strong>Slotword</strong> — a cozy word-guessing game. I'll be
          your buddy every step of the way. Let's learn how to play in two quick steps!
        </p>
      </motion.div>

      <motion.button
        onClick={onNext}
        whileTap={{ scale: 0.96 }}
        className="px-6 py-3.5 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-sm rounded-2xl shadow-[0_3px_0_#AF324B] transition-all flex items-center gap-2 cursor-pointer"
      >
        Let's go!
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
}

// ═══ STEP 2 — Interactive how-to-play ═════════════════════════════════
function Step2Tutorial({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  // Phase A: show the pre-filled demo guess with annotated color reveals.
  // Phase B: let the player type their own guess and see the colors.
  const [phase, setPhase] = useState<'demo' | 'try' | 'done'>('demo');
  const [playerGuess, setPlayerGuess] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const demoStates = calculateLetterStates(DEMO_GUESS, TUTORIAL_WORD);

  const playerStates = submitted
    ? calculateLetterStates(playerGuess, TUTORIAL_WORD)
    : [];

  const handleKey = (key: string) => {
    if (submitted) return;
    sound.playKeyPress();
    if (key === 'DELETE') {
      setPlayerGuess(prev => prev.slice(0, -1));
    } else if (playerGuess.length < TUTORIAL_WORD.length) {
      setPlayerGuess(prev => (prev + key).toUpperCase());
    }
  };

  const submit = () => {
    if (playerGuess.length !== TUTORIAL_WORD.length) {
      sound.playShakeSound();
      return;
    }
    sound.playKeyEnter();
    setSubmitted(true);
    setTimeout(() => {
      const states = calculateLetterStates(playerGuess, TUTORIAL_WORD);
      states.forEach((st, idx) => sound.playTileReveal(idx * 0.08, st));
    }, 50);
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-[#F2B84B]" />
        <h2 className="font-logo font-extrabold text-xl text-[#3D342F]">How to Play</h2>
      </div>

      {/* The target word, revealed for the tutorial */}
      <div className="bg-[#FFF3D6] border border-[#F2C974] rounded-full px-4 py-1.5 mb-5">
        <span className="text-[11px] font-display font-bold text-[#6F625B]">The word is </span>
        <span className="font-logo font-black text-[#3D342F] tracking-[0.2em]">{TUTORIAL_WORD}</span>
      </div>

      {/* Demo board */}
      {phase === 'demo' && (
        <div className="mb-5">
          <p className="text-xs text-[#6F625B] font-display mb-3">
            Watch this guess: <strong>{DEMO_GUESS}</strong>
          </p>
          <div className="flex justify-center gap-1.5 mb-4">
            {DEMO_GUESS.split('').map((letter, i) => (
              <motion.div
                key={i}
                initial={{ rotateX: 0, opacity: 0 }}
                animate={{ rotateX: [0, 90, 0], opacity: 1 }}
                transition={{ duration: 0.45, delay: i * 0.08, ease: 'easeInOut' }}
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 font-logo font-black text-xl sm:text-2xl flex items-center justify-center select-none ${TILE_STYLES[demoStates[i]]}`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {letter}
              </motion.div>
            ))}
          </div>

          {/* Color legend with annotations */}
          <div className="space-y-2 max-w-sm mx-auto text-left mb-5">
            {demoStates.map((st, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08 }}
                className="flex items-center gap-2.5 bg-[#FAF4EA] border border-[#EADFCB] rounded-xl px-3 py-2"
              >
                <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center text-xs font-bold ${TILE_STYLES[st]}`}>
                  {DEMO_GUESS[i]}
                </span>
                <span className="text-[11px] font-display font-bold text-[#3D342F]">
                  {STATE_LABEL[st]}
                </span>
                <span className="text-[10px] text-[#998D85] ml-auto">
                  {STATE_ICON[st]}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.button
            onClick={() => {
              sound.playRewardSound();
              setPhase('try');
            }}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-3 bg-[#F2B84B] hover:bg-[#E5A92F] text-white font-display font-extrabold text-sm rounded-xl shadow-[0_3px_0_#C48F1F] transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Now you try!
          </motion.button>
        </div>
      )}

      {/* Try-it-yourself phase */}
      {(phase === 'try' || phase === 'done') && (
        <div className="mb-5 w-full">
          <p className="text-xs text-[#6F625B] font-display mb-3">
            Type a 4-letter word and press Enter to see the colors!
          </p>

          {/* Mini board */}
          <div className="flex justify-center gap-1.5 mb-4">
            {Array.from({ length: TUTORIAL_WORD.length }).map((_, i) => {
              const letter = submitted ? playerGuess[i] : playerGuess[i] ?? '';
              const state: TileState = submitted
                ? playerStates[i]
                : letter
                ? 'current'
                : 'empty';
              return (
                <motion.div
                  key={i}
                  initial={submitted ? { rotateX: 0, opacity: 0 } : false}
                  animate={submitted ? { rotateX: [0, 90, 0], opacity: 1 } : { opacity: 1 }}
                  transition={{ duration: 0.45, delay: submitted ? i * 0.08 : 0, ease: 'easeInOut' }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-2 font-logo font-black text-xl sm:text-2xl flex items-center justify-center select-none ${TILE_STYLES[state]}`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {letter || ''}
                </motion.div>
              );
            })}
          </div>

          {/* Mini keyboard */}
          {!submitted && (
            <div className="max-w-xs mx-auto">
              <div className="flex justify-center gap-1 my-1">
                {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(k => (
                  <button
                    key={k}
                    onClick={() => handleKey(k)}
                    className="w-7 h-10 sm:w-8 sm:h-11 rounded-lg bg-[#F4EBDD] hover:bg-[#E7DCCB] text-[#3D342F] font-logo font-bold text-xs cursor-pointer active:scale-90 transition-transform"
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-1 my-1">
                {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(k => (
                  <button
                    key={k}
                    onClick={() => handleKey(k)}
                    className="w-7 h-10 sm:w-8 sm:h-11 rounded-lg bg-[#F4EBDD] hover:bg-[#E7DCCB] text-[#3D342F] font-logo font-bold text-xs cursor-pointer active:scale-90 transition-transform"
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div className="flex justify-center gap-1 my-1">
                <button
                  onClick={submit}
                  className="px-2.5 h-10 sm:h-11 rounded-lg bg-[#79B96B] hover:bg-[#5E9A50] text-white font-logo font-bold text-[10px] cursor-pointer active:scale-90 transition-transform"
                >
                  ENTER
                </button>
                {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(k => (
                  <button
                    key={k}
                    onClick={() => handleKey(k)}
                    className="w-7 h-10 sm:w-8 sm:h-11 rounded-lg bg-[#F4EBDD] hover:bg-[#E7DCCB] text-[#3D342F] font-logo font-bold text-xs cursor-pointer active:scale-90 transition-transform"
                  >
                    {k}
                  </button>
                ))}
                <button
                  onClick={() => handleKey('DELETE')}
                  className="px-2.5 h-10 sm:h-11 rounded-lg bg-[#F4EBDD] hover:bg-[#E7DCCB] text-[#3D342F] font-logo font-bold cursor-pointer active:scale-90 transition-transform flex items-center justify-center"
                >
                  <Delete className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Result + next */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <p className="text-sm text-[#6F625B] font-display">
                {playerGuess === TUTORIAL_WORD
                  ? '🎉 You solved it! All green means you got every letter right.'
                  : 'Nice! See how each tile shows a different color? That tells you which letters are in the word and where.'}
              </p>
              <motion.button
                onClick={onNext}
                whileTap={{ scale: 0.96 }}
                className="px-6 py-3 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-sm rounded-2xl shadow-[0_3px_0_#AF324B] transition-all flex items-center gap-2 cursor-pointer mx-auto"
              >
                Got it!
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {!submitted && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-display font-bold text-[#A69485] hover:text-[#3D342F] transition-colors cursor-pointer mt-4 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ STEP 3 — Pick avatar + fun name ═════════════════════════════════
function Step3Identity({
  onComplete,
  onBack,
}: {
  onComplete: (username: string, avatar: string) => void;
  onBack: () => void;
}) {
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [username, setUsername] = useState('');

  const trimmed = username.trim().replace(/^@+/, '');
  const canFinish = trimmed.length > 0;

  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-center gap-2 mb-4">
        <PartyPopper className="w-5 h-5 text-[#E45C75]" />
        <h2 className="font-logo font-extrabold text-xl text-[#3D342F]">Make it Yours</h2>
      </div>
      <p className="text-sm text-[#6F625B] font-display mb-5 max-w-sm">
        Pick a buddy avatar and a fun name. No real names — just something silly you like!
      </p>

      {/* Avatar preview */}
      <motion.div
        key={avatar}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#FFD98F] to-[#F2B64B] border-2 border-[#EAD9A8] flex items-center justify-center text-4xl shadow-raised mb-4"
      >
        {avatar}
      </motion.div>

      {/* Avatar picker */}
      <div className="grid grid-cols-5 gap-2 mb-5 max-w-xs">
        {AVATAR_OPTIONS.map(opt => (
          <button
            key={opt}
            onClick={() => {
              sound.playKeyPress();
              setAvatar(opt);
            }}
            className={`w-12 h-12 rounded-xl text-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
              avatar === opt
                ? 'bg-[#FFF3D6] border-[#F2C974] shadow-[0_2px_0_#E5B74E] scale-105'
                : 'bg-white border-[#E7DCCB] hover:bg-[#FAF4EA]'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Name input */}
      <div className="w-full max-w-xs mb-5">
        <label className="text-[11px] font-display font-bold text-[#6F625B] block mb-1.5 text-left">
          Your fun name
        </label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value.replace(/^@+/, '').slice(0, 16))}
          onKeyDown={e => e.key === 'Enter' && canFinish && onComplete(username, avatar)}
          placeholder="paperpilot"
          maxLength={16}
          autoFocus
          className="w-full px-4 py-3 rounded-xl border-2 border-[#E7DCCB] font-mono text-sm font-semibold text-center bg-white focus:outline-none focus:border-[#F28C6F] focus:ring-2 focus:ring-[#FDECE7] placeholder:text-[#D8CCBC] placeholder:font-display placeholder:text-xs"
        />
        <p className="text-[10px] text-[#998D85] mt-1.5">
          Pick any nickname — just no real names or personal info!
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-3 bg-[#FAF4EA] border border-[#E7DCCB] text-[#6F625B] font-display font-extrabold text-xs rounded-xl hover:bg-[#F4EBDD] transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <motion.button
          onClick={() => onComplete(username, avatar)}
          disabled={!canFinish}
          whileTap={{ scale: 0.96 }}
          className={`px-6 py-3 font-display font-extrabold text-sm rounded-2xl transition-all flex items-center gap-2 cursor-pointer ${
            canFinish
              ? 'bg-[#E45C75] hover:bg-[#D34B64] text-white shadow-[0_3px_0_#AF324B]'
              : 'bg-[#F4EBDD] text-[#A69485] cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4" />
          Start Playing!
        </motion.button>
      </div>
    </div>
  );
}
