import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, ShieldCheck, ChevronDown, ChevronUp, Link, ArrowLeft, Cpu, HelpCircle } from 'lucide-react';
import { ScreenType, HISTORICAL_DAYS, VerifiedDay } from '../types';

interface VerificationCenterViewProps {
  onNavigate: (screen: ScreenType) => void;
  onUnlockAchievement: (id: string) => void;
}

export default function VerificationCenterView({ onNavigate, onUnlockAchievement }: VerificationCenterViewProps) {
  const [openDay, setOpenDay] = useState<string | null>('2026-08-03'); // Yesterday open by default
  const [checkingDay, setCheckingDay] = useState<string | null>(null);
  const [checkedDays, setCheckedDays] = useState<Record<string, boolean>>({});

  // Trigger interactive verification algorithm simulation
  const handleVerifyAlgorithm = (day: VerifiedDay) => {
    setCheckingDay(day.date);
    setTimeout(() => {
      setCheckingDay(null);
      setCheckedDays(prev => ({ ...prev, [day.date]: true }));
      onUnlockAchievement('verify-lookup');
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E7DCCB]">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-sm font-display font-bold text-[#6F625B] hover:text-[#3D342F] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <span className="text-xs text-[#998D85] font-mono">Proof of Fairness</span>
      </div>

      {/* Main Friendly Banner */}
      <div className="bg-[#E9F6EE] border-2 border-[#A8D8B9] rounded-3xl p-6 text-center mb-8 shadow-sm">
        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border border-[#A8D8B9] shadow-sm select-none">
          🛡️
        </div>
        
        <h2 className="text-2xl font-logo font-extrabold text-[#3D342F] mb-2">
          Yesterday’s word was verified ✓
        </h2>
        
        <p className="text-sm text-[#3D342F] max-w-md mx-auto leading-relaxed">
          The published word matches the secret word that was locked before anyone played. This prevents organizers from altering word lists mid-day.
        </p>
      </div>

      {/* Accordion / Table list with progressive disclosure */}
      <div className="space-y-4 mb-8">
        <h3 className="text-lg font-logo font-extrabold text-[#3D342F] text-left">
          Historical Daily Proof Records
        </h3>

        {HISTORICAL_DAYS.map(day => {
          const isOpen = openDay === day.date;
          const isVerified = checkedDays[day.date];
          const isChecking = checkingDay === day.date;

          return (
            <div
              key={day.date}
              className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-2xl overflow-hidden shadow-sm hover:shadow-card transition-all"
            >
              {/* Header block (Toggleable) */}
              <button
                onClick={() => setOpenDay(isOpen ? null : day.date)}
                className="w-full p-4 flex items-center justify-between hover:bg-[#FFF9F0] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#E9F6EE] text-[#79B96B] flex items-center justify-center font-bold text-xs shadow-sm">
                    ✓
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-logo font-extrabold text-[#3D342F]">
                      {day.date === '2026-08-03' ? "Yesterday's Word" : `Record for ${day.date}`}
                    </span>
                    <div className="text-xs text-[#6F625B] font-mono">
                      Secret Word: <strong className="text-[#3D342F] font-logo uppercase">{day.word}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isVerified && (
                    <span className="px-2.5 py-1 bg-[#EAF5E7] border border-[#79B96B] text-[10px] text-[#79B96B] font-bold rounded-lg uppercase tracking-wider font-display">
                      Match Confirmed ✓
                    </span>
                  )}
                  {isOpen ? <ChevronUp className="w-4 h-4 text-[#6F625B]" /> : <ChevronDown className="w-4 h-4 text-[#6F625B]" />}
                </div>
              </button>

              {/* Progressive Disclosure (Expanded Content) */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t border-[#E7DCCB]"
                  >
                    <div className="p-4 space-y-4 bg-[#FFF9F0]/60 text-xs">
                      
                      {/* Short summary block */}
                      <p className="text-[#6F625B] leading-relaxed">
                        To verify this day, we combine the daily seed and yesterday's word, hash it using SHA-256, and confirm it matches the on-chain pre-committed record.
                      </p>

                      {/* Code blocks for technical metrics */}
                      <div className="space-y-2.5 font-mono text-[10px] text-[#3D342F] bg-white p-3.5 rounded-xl border border-[#E7DCCB] leading-relaxed">
                        <div>
                          <strong className="text-[#6F625B]">Pre-committed Hash (Locked before play):</strong>
                          <div className="text-[#3D342F] break-all select-all">{day.hash}</div>
                        </div>
                        <div className="pt-2 border-t border-[#E7DCCB]/60">
                          <strong className="text-[#6F625B]">Daily Validation Seed:</strong>
                          <div className="text-[#3D342F] font-logo font-semibold">{day.seed}</div>
                        </div>
                        <div className="pt-2 border-t border-[#E7DCCB]/60">
                          <strong className="text-[#6F625B]">Solana Transaction:</strong>
                          <div className="text-[#65B9E8] break-all select-all flex items-center gap-1 hover:underline cursor-pointer">
                            <Link className="w-3 h-3 shrink-0" />
                            {day.txSignature}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-[#E7DCCB]/60 flex justify-between">
                          <span>Block timestamp:</span>
                          <strong>{day.blockTime} UTC</strong>
                        </div>
                      </div>

                      {/* Interactive Checker button */}
                      <div className="flex justify-end pt-2">
                        {isChecking ? (
                          <div className="px-4 py-2 bg-[#F4EBDD] border border-[#E7DCCB] text-[#3D342F] rounded-xl flex items-center gap-1.5 font-bold">
                            <span className="w-3.5 h-3.5 border-2 border-[#3D342F] border-t-transparent rounded-full animate-spin" />
                            Re-hashing SHA-256 on-chain...
                          </div>
                        ) : isVerified ? (
                          <div className="px-4 py-2 bg-[#EAF5E7] border border-[#79B96B] text-[#79B96B] font-display font-bold rounded-xl flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Pre-commit Matches Seed Exactly!
                          </div>
                        ) : (
                          <button
                            onClick={() => handleVerifyAlgorithm(day)}
                            className="px-4 py-2 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all text-xs"
                          >
                            <Cpu className="w-3.5 h-3.5" />
                            Run Fairness Checker
                          </button>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Helpful explanation of cryptographics */}
      <div className="bg-[#FFF3D6] border border-[#F2B84B] rounded-2xl p-5 text-left text-xs leading-relaxed text-[#3D342F]">
        <h4 className="font-logo font-bold text-sm mb-1.5 flex items-center gap-1 text-[#D99B28]">
          <HelpCircle className="w-4 h-4 shrink-0" />
          How do pre-committed hashes protect you?
        </h4>
        <p className="mb-2">
          At midnight, the Slotword engine registers a locked puzzle metadata record. This contains the SHA-256 hash of the answer word and a secret salt seed.
        </p>
        <p>
          Organizers cannot swap today's word to favor any user or opponent because any modified word would produce a completely different cryptographic hash that would instantly fail verification checks on-chain!
        </p>
      </div>

    </div>
  );
}
