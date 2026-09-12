import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  Trophy,
  Award,
  Coins,
  Plus,
  X,
  Users,
  Compass,
  Volume2,
  VolumeX,
  Gamepad2,
  PartyPopper,
  User,
  LogOut
} from 'lucide-react';

import {
  ScreenType,
  PlayerProfile,
  levelFromXp,
  levelTitle,
  Difficulty,
  DIFFICULTIES,
} from './types';
import { useGameStore, useSessionStore } from './store/gameStore';
import { ensureAnonymousSession } from './lib/supabase';
import { fetchServerProfile } from './lib/duelService';
import type { DuelOutcome } from './lib/duelTypes';
import { sound } from './utils/audio';
import LandingPage from './components/LandingPage';
import DashboardView from './components/DashboardView';
import PuzzleView from './components/PuzzleView';
import DuelView from './components/DuelView';
import LeaderboardView from './components/LeaderboardView';
import AchievementsView from './components/AchievementsView';
import ProfileView from './components/ProfileView';
import OnboardingView from './components/OnboardingView';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');

  // Player profile: coins + XP economy. Lives in the persisted game store so
  // progress survives a refresh (previously reset to defaults on every load).
  const profile = useGameStore(s => s.profile);
  const setProfile = useGameStore(s => s.setProfile);
  const coinHistory = useGameStore(s => s.coinHistory);
  const setCoinHistory = useGameStore(s => s.setCoinHistory);
  const achievements = useGameStore(s => s.achievements);
  const setAchievements = useGameStore(s => s.setAchievements);
  const settledDuelIds = useGameStore(s => s.settledDuelIds);
  const markDuelSettled = useGameStore(s => s.markDuelSettled);

  // Anonymous backend session for duels (Phase 1). Resolves to local-only
  // mode (playerId null) when Supabase isn't configured or offline.
  const setSession = useSessionStore(s => s.setSession);
  useEffect(() => {
    let cancelled = false;
    ensureAnonymousSession().then(id => {
      if (!cancelled) setSession(id);
    });
    return () => {
      cancelled = true;
    };
  }, [setSession]);

  const [pouchOpen, setPouchOpen] = useState(false);

  // Duel code from a share link (?duel=ABC123) — handed to the Duel screen.
  const [pendingJoinCode, setPendingJoinCode] = useState<string | null>(null);
  const activeDuelId = useGameStore(s => s.activeDuelId);

  // Parse ?duel=CODE once on load (friend's invite link).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duelCode = params.get('duel');
    if (duelCode) {
      setPendingJoinCode(duelCode.toUpperCase());
      setCurrentScreen('duel');
      params.delete('duel');
      const qs = params.toString();
      window.history.replaceState({}, '', window.location.pathname + (qs ? `?${qs}` : ''));
    }
  }, []);

  // Audio mute/unmute state
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleAudio = () => {
    const nextState = sound.toggleSound();
    setSoundEnabled(nextState);
    if (nextState) sound.playKeyPress();
  };

  // Floating celebration elements
  const [celebrationStars, setCelebrationStars] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const triggerCelebration = () => {
    const stars = Array.from({ length: 12 }).map(() => ({
      id: Math.random(),
      x: 20 + Math.random() * 60,
      y: 10 + Math.random() * 50,
    }));
    setCelebrationStars(stars);
    setTimeout(() => setCelebrationStars([]), 2500);
  };

  // ── Coin helpers ────────────────────────────────────────────────────
  const addCoins = (amount: number, desc: string) => {
    setProfile(prev => ({ ...prev, coins: prev.coins + amount }));
    setCoinHistory(prev => [
      { desc, amount: `+${amount}`, type: 'plus', time: 'Just now' },
      ...prev,
    ]);
  };

  // ── XP + level helpers ──────────────────────────────────────────────
  const addXp = (amount: number) => {
    setProfile(prev => {
      const before = levelFromXp(prev.xp);
      const xp = prev.xp + amount;
      const after = levelFromXp(xp);
      if (after.level > before.level) {
        setTimeout(() => {
          sound.playRewardSound();
          triggerCelebration();
          setLevelUpToast(`Level ${after.level} · ${levelTitle(after.level)}`);
        }, 50);
      }
      return { ...prev, xp };
    });
  };

  const [levelUpToast, setLevelUpToast] = useState<string | null>(null);

  const handleLevelUpToastDone = () => setLevelUpToast(null);

  // ── Achievements ────────────────────────────────────────────────────
  const handleUnlockAchievement = (id: string) => {
    let unlockedAny = false;
    setAchievements(prev =>
      prev.map(item => {
        if (item.id === id && !item.unlocked) {
          unlockedAny = true;
          return { ...item, unlocked: true, unlockedAt: 'Just now' };
        }
        return item;
      })
    );
    if (unlockedAny) {
      sound.playRewardSound();
      triggerCelebration();
    }
  };

  // ── Puzzle solve callback ───────────────────────────────────────────
  const handleSolvePuzzle = (attempts: number, difficulty: Difficulty, won: boolean) => {
    const cfg = DIFFICULTIES.find(d => d.id === difficulty)!;

    setProfile(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      gamesWon: won ? prev.gamesWon + 1 : prev.gamesWon,
      bestAttempts: {
        ...prev.bestAttempts,
        [difficulty]:
          won && (prev.bestAttempts[difficulty] === null || attempts < prev.bestAttempts[difficulty]!)
            ? attempts
            : prev.bestAttempts[difficulty],
      },
    }));

    if (won) {
      const bonus = Math.max(0, cfg.attempts - attempts) * 2;
      addCoins(cfg.baseReward + bonus, `Solved ${cfg.label} puzzle`);
      addXp(cfg.xpReward);
      // Confetti stars on every solve — previously only level-ups,
      // achievement unlocks, and the coin faucet celebrated.
      triggerCelebration();
      handleUnlockAchievement('first-win');
      if (attempts <= 3) handleUnlockAchievement('solve-3');
    } else {
      addCoins(5, 'Participation bonus');
      addXp(10);
    }
  };

  // ── Duel result callback ────────────────────────────────────────────
  // Phase 2: the server's `players` row is the source of truth —
  // settle_duel already awarded coins/XP/duels_* server-side and
  // idempotently. We apply an instant local mirror for immediate pouch
  // feedback, mark the duel settled (so a refresh can't re-award), then
  // async-sync the authoritative server values back into the profile.
  // If Supabase is unconfigured (offline), the local award stands alone.
  const handleDuelFinished = (outcome: DuelOutcome) => {
    const alreadySettled = settledDuelIds.includes(outcome.duelId);
    if (!alreadySettled) {
      markDuelSettled(outcome.duelId);
      setProfile(prev => ({
        ...prev,
        duelsPlayed: prev.duelsPlayed + 1,
        duelsWon: outcome.won ? prev.duelsWon + 1 : prev.duelsWon,
      }));
      const label = outcome.draw
        ? 'Duel tie bonus'
        : outcome.won
        ? 'Duel win pot'
        : 'Duel consolation coins';
      addCoins(outcome.rewards.coins, label);
      addXp(outcome.rewards.xp);
      if (outcome.won) handleUnlockAchievement('duel-win');
    }

    // Reconcile with the server — replaces coins/xp/duels_* with the
    // authoritative totals (server already includes this duel's award).
    // Best-effort: a network failure just leaves the local mirror in place.
    fetchServerProfile().then(server => {
      if (!server) return;
      setProfile(prev => ({
        ...prev,
        coins: server.coins,
        xp: server.xp,
        duelsPlayed: server.duelsPlayed,
        duelsWon: server.duelsWon,
        // The create_duel/join_duel RPCs upsert username/avatar, so the
        // server row is the freshest source for those too.
        username: server.username || prev.username,
        avatar: server.avatar || prev.avatar,
      }));
    });
  };

  // Achievements can be granted by checks over time (coins/level milestones)
  const checkMilestoneAchievements = () => {
    if (profile.coins >= 500) handleUnlockAchievement('coins-500');
    if (levelFromXp(profile.xp).level >= 5) handleUnlockAchievement('level-5');
  };

  const level = levelFromXp(profile.xp);

  const updateProfile = (patch: Partial<PlayerProfile>) => {
    setProfile(prev => ({ ...prev, ...patch }));
  };

  // ── Onboarding completion (Phase 2) ────────────────────────────────
  // Fired by OnboardingView's final step — stores the kid's chosen avatar
  // + fun name and flips hasOnboarded so the gate never shows again.
  const handleOnboardingComplete = (username: string, avatar: string) => {
    sound.playRewardSound();
    triggerCelebration();
    setProfile(prev => ({
      ...prev,
      hasOnboarded: true,
      username: username.trim().replace(/^@+/, '') || 'paperpilot',
      avatar: avatar || prev.avatar,
    }));
    setCurrentScreen('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#3D342F] font-body selection:bg-[#FFF3D6] relative flex flex-col justify-between">

      {/* 1. TOP GLOBAL APP HEADER */}
      <header className="sticky top-0 z-40 bg-[#FFFCF7]/95 backdrop-blur-md border-b-2 border-[#E7DCCB] px-2.5 sm:px-4 py-2 sm:py-3 shadow-[0_2px_12px_rgba(61,52,47,0.02)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">

          {/* Brand & Nav Left Cluster */}
          <div className="flex items-center gap-2 sm:gap-8 min-w-0">
            <motion.button
              onClick={() => setCurrentScreen('landing')}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 group cursor-pointer focus:outline-hidden shrink-0"
              aria-label="Slotword home"
            >
              <div className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 bg-[#E45C75] rounded-xl flex items-center justify-center font-logo font-bold text-white text-sm sm:text-base shadow-[0_2.5px_0_#AF324B] group-hover:scale-105 group-hover:rotate-[-3deg] transition-all">
                S
              </div>
              <span className="font-logo font-black text-xl sm:text-2xl tracking-tight text-[#3D342F] group-hover:text-[#E45C75] transition-colors">
                Slotword
              </span>
            </motion.button>

            {currentScreen !== 'landing' && (
              <nav className="hidden md:flex items-center gap-6 relative">
                {[
                  { id: 'dashboard' as ScreenType, label: 'Workshop', icon: Compass, color: 'text-[#E45C75]' },
                  { id: 'play' as ScreenType, label: 'Play', icon: Gamepad2, color: 'text-[#F2B84B]' },
                  { id: 'duel' as ScreenType, label: 'Duels', icon: Users, color: 'text-[#F28C6F]' },
                  { id: 'leaderboard' as ScreenType, label: 'Rankings', icon: Trophy, color: 'text-[#65B9E8]' },
                  { id: 'achievements' as ScreenType, label: 'Badges', icon: Award, color: 'text-[#8B72C9]' },
                  { id: 'profile' as ScreenType, label: 'Profile', icon: User, color: 'text-[#79B96B]' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setCurrentScreen(item.id)}
                      whileTap={{ scale: 0.96 }}
                      className={`relative py-1.5 text-xs font-display font-extrabold tracking-wide transition-colors flex items-center gap-1.5 group/nav cursor-pointer`}
                    >
                      <Icon className={`w-3.5 h-3.5 transition-transform group-hover/nav:scale-110 ${currentScreen === item.id ? item.color : 'text-[#A69485]'}`} />
                      <span>{item.label}</span>
                      {currentScreen === item.id && (
                        <motion.div
                          layoutId="activeHeaderTabLine"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E45C75] rounded-full"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right side Player Status cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <div className="flex items-center bg-[#FAF4EA] border border-[#EADFCB] rounded-full p-0.5 sm:p-1 shadow-[0_2px_12px_-4px_rgba(61,52,47,0.06)] max-w-full overflow-x-auto no-scrollbar shrink-0">
              <motion.button
                onClick={toggleAudio}
                whileTap={{ scale: 0.9 }}
                className="p-1 sm:p-1.5 rounded-full hover:bg-white/80 text-[#6F625B] hover:text-[#3D342F] transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
                aria-label={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#428033]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-[#A69485]" />
                )}
              </motion.button>

              <div className="w-[1px] h-3.5 sm:h-4 bg-[#EADFCB] mx-0.5" />

              {/* Level + XP chip */}
              <div
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full text-[#3D342F] transition-colors"
                title={`Level ${level.level} · ${levelTitle(level.level)}`}
              >
                <span className="font-logo font-black text-xs text-[#3D342F] select-none">Lv {level.level}</span>
              </div>

              <div className="w-[1px] h-3.5 sm:h-4 bg-[#EADFCB] mx-0.5" />

              {/* Coin pouch button */}
              <motion.button
                id="coin-pouch-btn"
                onClick={() => setPouchOpen(true)}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-white active:bg-[#FFFCF7] text-[#3D342F] transition-all group/pouch cursor-pointer"
              >
                <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white border border-[#EADFCB] flex items-center justify-center text-[#6F625B] transition-colors group-hover/pouch:border-[#A69485] group-hover/pouch:bg-[#FFFDF9]">
                  <Coins className="w-2.5 h-2.5 text-[#F2B84B]" />
                </div>
                <span className="font-mono text-[11px] sm:text-xs font-bold text-[#4E433C] whitespace-nowrap">{profile.coins}</span>
              </motion.button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. FLOATING STAR STICKER CELEBRATION EFFECT */}
      <AnimatePresence>
        {celebrationStars.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {celebrationStars.map(star => (
              <motion.div
                key={star.id}
                className="absolute text-3xl select-none"
                style={{ left: `${star.x}%`, top: `${star.y}%` }}
                initial={{ opacity: 0, scale: 0.1, y: 30, rotate: 0 }}
                animate={{
                  opacity: [0, 1, 1, 0],
                  scale: [0.2, 1.2, 1, 0.4],
                  y: -50,
                  rotate: [0, 15, -15, 30],
                }}
                transition={{ duration: 2.2, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <PartyPopper className="w-7 h-7 text-[#E45C75]" />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Level-up toast */}
      <AnimatePresence>
        {levelUpToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-[#F0ECFA] border border-[#8B72C9] rounded-2xl shadow-raised flex items-center gap-2.5"
          >
            <div className="text-left">
              <div className="font-logo font-extrabold text-sm text-[#3D342F]">Level Up!</div>
              <div className="text-xs text-[#6F625B]">{levelUpToast}</div>
            </div>
            <button
              onClick={handleLevelUpToastDone}
              className="ml-1 p-1 text-[#998D85] hover:text-[#3D342F] cursor-pointer"
              aria-label="Dismiss level up"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN INTERACTIVE CONTENT PORT */}
      <main className="flex-1 w-full flex flex-col justify-start relative pb-20 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={profile.hasOnboarded ? currentScreen : 'onboarding'}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {!profile.hasOnboarded ? (
              <OnboardingView onComplete={handleOnboardingComplete} />
            ) : (
              <>
            {currentScreen === 'landing' && (
              <LandingPage
                onNavigate={setCurrentScreen}
              />
            )}

            {currentScreen === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentScreen}
                profile={profile}
                achievements={achievements}
                activeDuelId={activeDuelId}
              />
            )}

            {currentScreen === 'play' && (
              <PuzzleView
                onNavigate={setCurrentScreen}
                onSolve={handleSolvePuzzle}
              />
            )}

            {currentScreen === 'duel' && (
              <DuelView
                onNavigate={setCurrentScreen}
                onDuelFinished={handleDuelFinished}
                joinCode={pendingJoinCode}
                onJoinCodeHandled={() => setPendingJoinCode(null)}
              />
            )}

            {currentScreen === 'leaderboard' && (
              <LeaderboardView
                onNavigate={setCurrentScreen}
                profile={profile}
              />
            )}

            {currentScreen === 'achievements' && (
              <AchievementsView
                onNavigate={setCurrentScreen}
                achievements={achievements}
              />
            )}

            {currentScreen === 'profile' && (
              <ProfileView
                onNavigate={setCurrentScreen}
                profile={profile}
                achievements={achievements}
                onUpdateProfile={updateProfile}
                onOpenPouch={() => setPouchOpen(true)}
              />
            )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. FIXED MOBILE BOTTOM NAVIGATION BAR */}
      {profile.hasOnboarded && (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFCF7]/95 backdrop-blur-md border-t-2 border-[#E7DCCB] px-3 py-1.5 flex justify-around items-center shadow-[0_-4px_20px_rgba(61,52,47,0.08)]">
        {[
          { id: 'dashboard', label: 'Workshop', icon: Compass, color: 'text-[#E45C75]' },
          { id: 'play', label: 'Play', icon: Gamepad2, color: 'text-[#F2B84B]' },
          { id: 'duel', label: 'Duels', icon: Users, color: 'text-[#F28C6F]' },
          { id: 'leaderboard', label: 'Rankings', icon: Trophy, color: 'text-[#65B9E8]' },
          { id: 'achievements', label: 'Badges', icon: Award, color: 'text-[#8B72C9]' },
          { id: 'profile', label: 'Profile', icon: User, color: 'text-[#79B96B]' },
        ].map(nav => {
          const Icon = nav.icon;
          const isActive = currentScreen === nav.id;
          return (
            <motion.button
              key={nav.id}
              onClick={() => {
                sound.playKeyPress();
                setCurrentScreen(nav.id as ScreenType);
              }}
              whileTap={{ scale: 0.9 }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl min-w-[56px] transition-all cursor-pointer relative ${
                isActive ? 'bg-[#FAF4EA] text-[#3D342F]' : 'text-[#A69485] hover:text-[#6F625B]'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? nav.color : ''}`} />
              <span className={`text-[10px] font-display font-bold mt-0.5 ${isActive ? 'text-[#3D342F]' : 'text-[#A69485]'}`}>
                {nav.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="mobileActiveDockDot"
                  className={`absolute -bottom-1 w-1.5 h-1.5 rounded-full ${nav.color.replace('text-', 'bg-')}`}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      )}

      {/* 5. FOOTER CREDITS */}
      <footer className="py-8 border-t border-[#E7DCCB]/60 text-center text-xs text-[#998D85] font-display">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Slotword Workshop. Coins are fun-only — no real money involved.</p>
          <div className="flex gap-4">
            <button onClick={() => setCurrentScreen('profile')} className="hover:text-[#3D342F] transition-colors">
              Player Profile
            </button>
          </div>
        </div>
      </footer>

      {/* 6. COIN POUCH DRAWER */}
      <AnimatePresence>
        {pouchOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-[#3D342F]/40 backdrop-blur-xs">
            <div className="absolute inset-0" onClick={() => setPouchOpen(false)} />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-full sm:max-w-sm bg-[#FFFCF7] border-l border-[#E7DCCB] h-full shadow-raised p-4 sm:p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-[#E7DCCB] mb-4 sm:mb-6 shrink-0">
                  <div className="flex items-center gap-2 text-[#6F625B]">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-[#F2B84B]" />
                    <span className="font-logo font-extrabold text-[#3D342F] text-base sm:text-lg">Your Coin Pouch</span>
                  </div>
                  <motion.button
                    onClick={() => setPouchOpen(false)}
                    whileTap={{ scale: 0.96 }}
                    className="p-1.5 bg-[#F4EBDD] hover:bg-[#E7DCCB] rounded-lg text-[#3D342F] transition-colors cursor-pointer shrink-0"
                    aria-label="Close coin pouch"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                <div className="bg-[#F4EBDD] border border-[#E7DCCB] rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-4 sm:mb-6 text-left relative overflow-hidden shadow-xs shrink-0">
                  <div className="absolute right-[-20px] top-[-10px] text-4xl sm:text-5xl opacity-5 select-none font-logo pointer-events-none">
                    Slotword
                  </div>

                  <span className="text-[10px] sm:text-xs text-[#6F625B] font-display font-bold uppercase tracking-wider block">
                    Your Balance
                  </span>
                  <div className="text-2xl sm:text-3xl font-logo font-black text-[#3D342F] my-1 font-mono flex items-center gap-1.5">
                    <span>{profile.coins}</span>
                    <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-[#F2B84B]" />
                  </div>

                  <div className="text-[10px] font-mono text-[#998D85] bg-white/55 p-1.5 rounded-lg border border-[#E7DCCB]/60 mt-3 break-all">
                    Level {level.level} · {levelTitle(level.level)} · {level.intoLevel}/{level.neededForLevel} XP
                  </div>
                </div>

                {/* XP progress */}
                <div className="mb-4 shrink-0">
                  <div className="flex justify-between text-[11px] font-display font-bold text-[#6F625B] mb-1.5">
                    <span>Level {level.level} → {level.level + 1}</span>
                    <span className="font-mono">{level.intoLevel}/{level.neededForLevel} XP</span>
                  </div>
                  <div className="h-3 bg-[#F4EBDD] border border-[#E7DCCB] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-[#8B72C9] rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (level.intoLevel / level.neededForLevel) * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                    />
                  </div>
                  <p className="text-[10px] text-[#998D85] mt-1.5">Win puzzles and duels to earn XP and level up!</p>
                </div>

                <h4 className="text-[11px] sm:text-xs font-logo font-bold uppercase tracking-wider text-[#6F625B] text-left mb-2.5 shrink-0">
                  Pouch Ledger Receipts
                </h4>

                <div className="space-y-2 max-h-[180px] sm:max-h-[260px] overflow-y-auto pr-1 flex-1 min-h-[100px]">
                  {coinHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center py-6 px-4 bg-[#FFF9F0] border border-dashed border-[#E7DCCB] rounded-xl">
                      <Coins className="w-6 h-6 text-[#A69485] mb-2" />
                      <p className="text-xs text-[#6F625B] font-display">No transactions yet.</p>
                      <p className="text-[10px] text-[#998D85] mt-0.5">Solve a puzzle or win a duel to record your first receipt.</p>
                    </div>
                  ) : (
                    coinHistory.map((log, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2.5 sm:p-3 bg-[#FFF9F0] border border-[#E7DCCB]/60 rounded-xl text-xs"
                      >
                        <div className="text-left">
                          <div className="font-logo font-bold text-[#3D342F] text-xs">{log.desc}</div>
                          <div className="text-[10px] text-[#998D85]">{log.time}</div>
                        </div>
                        <div className={`inline-flex items-center gap-1 font-mono font-bold text-xs ${log.type === 'plus' ? 'text-[#79B96B]' : 'text-[#E45C75]'}`}>
                          <Coins className="w-3 h-3 text-[#F2B84B]" />
                          <span>{log.amount}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-[#E7DCCB] space-y-2 shrink-0 mt-3">
                <motion.button
                  onClick={() => {
                    addCoins(25, 'Free coin bonus');
                    sound.playRewardSound();
                    triggerCelebration();
                    checkMilestoneAchievements();
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-2.5 bg-[#F2B84B] hover:bg-[#E5A92F] text-white font-display font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Claim +25 Free Coins</span>
                </motion.button>

                <p className="text-[10px] text-center text-[#998D85] leading-relaxed pt-0.5">
                  Coins are just for fun. Win puzzles and duels to grow your pouch!
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
