import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Flame,
  ShieldCheck,
  Trophy,
  Award,
  Wallet,
  Plus,
  X,
  BookOpen,
  Users,
  Compass,
  Star,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  Calendar,
  HelpCircle,
  LogOut,
  Unplug
} from 'lucide-react';

import { ScreenType, WalletState, Achievement, INITIAL_ACHIEVEMENTS } from './types';
import { sound } from './utils/audio';
import LandingPage from './components/LandingPage';
import DashboardView from './components/DashboardView';
import DailyPuzzleView from './components/DailyPuzzleView';
import DuelView from './components/DuelView';
import LeaderboardView from './components/LeaderboardView';
import VerificationCenterView from './components/VerificationCenterView';
import AchievementsView from './components/AchievementsView';
import HowToPlayModal from './components/HowToPlayModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  
  // Wallet state (highly interactive simulated card pouch)
  const [wallet, setWallet] = useState<WalletState>({
    connected: true, // Started as connected to make onboarding instant and friendly
    address: 'Slotw0rdW12s89G7d5x90pQA71fR2tY',
    balance: 0.05, // starting balance in SOL
  });

  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);
  const [walletHistory, setWalletHistory] = useState<Array<{ desc: string; amount: string; type: 'plus' | 'minus'; time: string }>>([
    { desc: 'Lobby Entry Gift', amount: '+0.05000 SOL', type: 'plus', time: 'Just now' },
  ]);

  // Streak & game progress state
  const [streak, setStreak] = useState(6); // starts at 6, solving today's makes it 7!
  const [dailySolved, setDailySolved] = useState(false);
  const [playerAttempts, setPlayerAttempts] = useState(0);

  // Sticker achievement stamps
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);

  // Audio mute/unmute state
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleAudio = () => {
    const nextState = sound.toggleSound();
    setSoundEnabled(nextState);
    if (nextState) sound.playKeyPress();
  };

  // Floating celebration elements
  const [celebrationStars, setCelebrationStars] = useState<Array<{ id: number; x: number; y: number }>>([]);

  // Trigger floating paper stars celebration
  const triggerCelebration = () => {
    const stars = Array.from({ length: 12 }).map((_, i) => ({
      id: Math.random(),
      x: 20 + Math.random() * 60, // percentage offset
      y: 10 + Math.random() * 50,
    }));
    setCelebrationStars(stars);
    setTimeout(() => setCelebrationStars([]), 2500);
  };

  // Connect simulated wallet
  const handleConnectWallet = () => {
    setWallet(prev => ({
      ...prev,
      connected: true,
      balance: Math.max(prev.balance, 0.05),
    }));
    sound.playRewardSound();
    triggerCelebration();
  };

  // Disconnect simulated wallet
  const handleDisconnectWallet = () => {
    setWallet(prev => ({
      ...prev,
      connected: false,
    }));
    setWalletDrawerOpen(false);
    sound.playKeyPress();
  };

  // Add simulated funds
  const handleTopupSimulatedWallet = () => {
    setWallet(prev => ({ ...prev, balance: prev.balance + 0.02 }));
    setWalletHistory(prev => [
      { desc: 'Top up (Faucet SOL)', amount: '+0.02000 SOL', type: 'plus', time: 'Just now' },
      ...prev,
    ]);
    sound.playRewardSound();
    triggerCelebration();
  };

  // Deduct balance helper
  const handleDeductBalance = (amount: number) => {
    setWallet(prev => ({ ...prev, balance: Math.max(0, prev.balance - amount) }));
    setWalletHistory(prev => [
      { desc: 'On-chain verification fee', amount: `-${amount.toFixed(5)} SOL`, type: 'minus', time: 'Just now' },
      ...prev,
    ]);
  };

  // Add balance helper (prizes)
  const handleAddBalance = (amount: number) => {
    setWallet(prev => ({ ...prev, balance: prev.balance + amount }));
    setWalletHistory(prev => [
      { desc: 'Match Duel Prize payout', amount: `+${amount.toFixed(5)} SOL`, type: 'plus', time: 'Just now' },
      ...prev,
    ]);
    sound.playRewardSound();
    triggerCelebration();
  };

  // Unlocking achievements stamps
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
      triggerCelebration();
    }
  };

  // Callback when player completes daily puzzle or practice
  const handleSolvePuzzle = (attempts: number) => {
    setPlayerAttempts(attempts);
    
    // Unlock attempts badge if solved in <= 3 attempts
    if (attempts <= 3) {
      handleUnlockAchievement('solve-3');
    }

    if (currentScreen === 'daily') {
      // Complete daily streak
      if (!dailySolved) {
        setDailySolved(true);
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        // If streak reaches 7, unlock streak badge
        if (newStreak >= 7) {
          handleUnlockAchievement('streak-7');
        }
      }
    }
    triggerCelebration();
  };

  return (
    <div className="min-h-screen bg-[#FFF9F0] text-[#3D342F] font-body selection:bg-[#FFF3D6] relative flex flex-col justify-between">
      
      {/* 1. TOP GLOBAL APP HEADER */}
      <header className="sticky top-0 z-40 bg-[#FFFCF7]/95 backdrop-blur-md border-b-2 border-[#E7DCCB] px-2.5 sm:px-4 py-2 sm:py-3 shadow-[0_2px_12px_rgba(61,52,47,0.02)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          
          {/* Brand & Breathable Nav Left Cluster */}
          <div className="flex items-center gap-2 sm:gap-8 min-w-0">
            {/* Logo with Baloo 2 typeface */}
            <motion.button
              onClick={() => setCurrentScreen('landing')}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 group cursor-pointer focus:outline-hidden shrink-0"
            >
              <div className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 bg-[#E45C75] rounded-xl flex items-center justify-center font-logo font-bold text-white text-sm sm:text-base shadow-[0_2.5px_0_#AF324B] group-hover:scale-105 group-hover:rotate-[-3deg] transition-all">
                S
              </div>
              <span className="font-logo font-black text-xl sm:text-2xl tracking-tight text-[#3D342F] group-hover:text-[#E45C75] transition-colors">
                Slotword
              </span>
            </motion.button>

            {/* Nav pills when inside active screens (Desktop Navigation) */}
            {currentScreen !== 'landing' && (
              <nav className="hidden md:flex items-center gap-6 relative">
                <motion.button
                  onClick={() => setCurrentScreen('dashboard')}
                  whileTap={{ scale: 0.96 }}
                  className={`relative py-1.5 text-xs font-display font-extrabold tracking-wide transition-colors flex items-center gap-1.5 group/nav cursor-pointer`}
                >
                  <Compass className={`w-3.5 h-3.5 transition-transform group-hover/nav:scale-110 ${currentScreen === 'dashboard' ? 'text-[#E45C75]' : 'text-[#A69485]'}`} />
                  <span>Workshop</span>
                  {currentScreen === 'dashboard' && (
                    <motion.div
                      layoutId="activeHeaderTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E45C75] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
                <motion.button
                  onClick={() => setCurrentScreen('duel')}
                  whileTap={{ scale: 0.96 }}
                  className={`relative py-1.5 text-xs font-display font-extrabold tracking-wide transition-colors flex items-center gap-1.5 group/nav cursor-pointer`}
                >
                  <Users className={`w-3.5 h-3.5 transition-transform group-hover/nav:scale-110 ${currentScreen === 'duel' ? 'text-[#F28C6F]' : 'text-[#A69485]'}`} />
                  <span>Duels</span>
                  {currentScreen === 'duel' && (
                    <motion.div
                      layoutId="activeHeaderTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F28C6F] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
                <motion.button
                  onClick={() => setCurrentScreen('leaderboard')}
                  whileTap={{ scale: 0.96 }}
                  className={`relative py-1.5 text-xs font-display font-extrabold tracking-wide transition-colors flex items-center gap-1.5 group/nav cursor-pointer`}
                >
                  <Trophy className={`w-3.5 h-3.5 transition-transform group-hover/nav:scale-110 ${currentScreen === 'leaderboard' ? 'text-[#65B9E8]' : 'text-[#A69485]'}`} />
                  <span>Rankings</span>
                  {currentScreen === 'leaderboard' && (
                    <motion.div
                      layoutId="activeHeaderTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#65B9E8] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
                <motion.button
                  onClick={() => setCurrentScreen('achievements')}
                  whileTap={{ scale: 0.96 }}
                  className={`relative py-1.5 text-xs font-display font-extrabold tracking-wide transition-colors flex items-center gap-1.5 group/nav cursor-pointer`}
                >
                  <Award className={`w-3.5 h-3.5 transition-transform group-hover/nav:scale-110 ${currentScreen === 'achievements' ? 'text-[#8B72C9]' : 'text-[#A69485]'}`} />
                  <span>Badges</span>
                  {currentScreen === 'achievements' && (
                    <motion.div
                      layoutId="activeHeaderTabLine"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8B72C9] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              </nav>
            )}
          </div>

          {/* Right side User Status cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Minimal Mobile Dashboard quick toggle */}
            {currentScreen !== 'landing' && (
              <motion.button
                onClick={() => setCurrentScreen('dashboard')}
                whileTap={{ scale: 0.96 }}
                className="md:hidden p-1.5 sm:p-2 bg-[#FAF4EA] hover:bg-[#FAF4EA]/80 border border-[#E9DCC6] rounded-xl text-[#3D342F] transition-colors cursor-pointer"
                title="Back to Workshop"
              >
                <Compass className="w-4 h-4" />
              </motion.button>
            )}

            {/* Hand-crafted Unified User Status Pill - Fully Responsive */}
            <div className="flex items-center bg-[#FAF4EA] border border-[#EADFCB] rounded-full p-0.5 sm:p-1 shadow-[0_2px_12px_-4px_rgba(61,52,47,0.06)] max-w-full overflow-x-auto no-scrollbar shrink-0">
              {/* How to Play Help Widget Trigger */}
              <motion.button
                onClick={() => {
                  sound.playKeyPress();
                  setHowToPlayOpen(true);
                }}
                whileTap={{ scale: 0.9 }}
                className="p-1 sm:p-1.5 rounded-full hover:bg-white/80 text-[#3D342F] transition-colors cursor-pointer flex items-center gap-1 px-1.5 sm:px-2 shrink-0"
                title="How to Play Guide for Solvers"
                aria-label="How to Play Guide"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#65B9E8] shrink-0" />
                <span className="hidden md:inline font-display font-bold text-[11px] text-[#4E433C] whitespace-nowrap">How to Play</span>
              </motion.button>

              {/* Precise vertical separator line */}
              <div className="w-[1px] h-3.5 sm:h-4 bg-[#EADFCB] mx-0.5" />

              {/* Sound Effects Toggle Button */}
              <motion.button
                onClick={toggleAudio}
                whileTap={{ scale: 0.9 }}
                className="p-1 sm:p-1.5 rounded-full hover:bg-white/80 text-[#6F625B] hover:text-[#3D342F] transition-colors cursor-pointer"
                title={soundEnabled ? 'Mute Sound Effects' : 'Unmute Sound Effects'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-[#428033]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-[#A69485]" />
                )}
              </motion.button>

              {/* Precise vertical separator line */}
              <div className="w-[1px] h-3.5 sm:h-4 bg-[#EADFCB] mx-0.5" />

              {/* Daily Streak Pouch Section */}
              <motion.div
                onClick={() => setCurrentScreen('achievements')}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full hover:bg-[#FFF2EE] text-[#3D342F] transition-all cursor-pointer group/streak"
                title="Your active puzzle streak"
              >
                <Flame className="w-3.5 h-3.5 text-[#F28C6F] transition-transform group-hover/streak:scale-110" />
                <span className="font-logo font-black text-xs text-[#3D342F] select-none">{streak}</span>
              </motion.div>

              {/* Precise vertical separator line */}
              <div className="w-[1px] h-3.5 sm:h-4 bg-[#EADFCB] mx-0.5" />

              {/* Wallet/Pouch balance section */}
              {wallet.connected ? (
                <motion.button
                  id="wallet-pouch-btn"
                  onClick={() => setWalletDrawerOpen(true)}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full hover:bg-white active:bg-[#FFFCF7] text-[#3D342F] transition-all group/wallet cursor-pointer"
                >
                  <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-white border border-[#EADFCB] flex items-center justify-center text-[#6F625B] transition-colors group-hover/wallet:border-[#A69485] group-hover/wallet:bg-[#FFFDF9]">
                    <Wallet className="w-2.5 h-2.5 text-[#6F625B]" />
                  </div>
                  <span className="font-mono text-[11px] sm:text-xs font-bold text-[#4E433C] whitespace-nowrap">{wallet.balance.toFixed(3)} SOL</span>
                </motion.button>
              ) : (
                <motion.button
                  id="connect-wallet-btn"
                  onClick={handleConnectWallet}
                  whileTap={{ scale: 0.96 }}
                  className="px-2.5 sm:px-3.5 py-1 sm:py-1.5 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-black text-[11px] sm:text-xs rounded-full transition-colors shadow-xs cursor-pointer whitespace-nowrap"
                >
                  Connect Pouch
                </motion.button>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* 2. FLOATING STAR STICKER CELEBRATION EFFECT (Section 13) */}
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
                transition={{
                  duration: 2.2,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                ⭐️
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* 3. MAIN INTERACTIVE CONTENT PORT */}
      <main className="flex-1 w-full flex flex-col justify-start relative pb-20 md:pb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {currentScreen === 'landing' && (
              <LandingPage
                onNavigate={setCurrentScreen}
                onConnectWallet={handleConnectWallet}
                walletConnected={wallet.connected}
              />
            )}

            {currentScreen === 'dashboard' && (
              <DashboardView
                onNavigate={setCurrentScreen}
                streak={streak}
                dailySolved={dailySolved}
                achievements={achievements}
              />
            )}

            {currentScreen === 'daily' && (
              <DailyPuzzleView
                onNavigate={setCurrentScreen}
                isDaily={true}
                dailySolved={dailySolved}
                setDailySolved={setDailySolved}
                onSolve={handleSolvePuzzle}
                wallet={wallet}
                onConnectWallet={handleConnectWallet}
                onDeductBalance={handleDeductBalance}
              />
            )}

            {currentScreen === 'practice' && (
              <DailyPuzzleView
                onNavigate={setCurrentScreen}
                isDaily={false}
                dailySolved={false}
                setDailySolved={() => {}}
                onSolve={handleSolvePuzzle}
                wallet={wallet}
                onConnectWallet={handleConnectWallet}
                onDeductBalance={handleDeductBalance}
              />
            )}

            {currentScreen === 'duel' && (
              <DuelView
                onNavigate={setCurrentScreen}
                wallet={wallet}
                onConnectWallet={handleConnectWallet}
                onAddBalance={handleAddBalance}
                onDeductBalance={handleDeductBalance}
                onUnlockAchievement={handleUnlockAchievement}
              />
            )}

            {currentScreen === 'leaderboard' && (
              <LeaderboardView
                onNavigate={setCurrentScreen}
                playerSolved={dailySolved}
                playerAttempts={playerAttempts}
              />
            )}

            {currentScreen === 'verify' && (
              <VerificationCenterView
                onNavigate={setCurrentScreen}
                onUnlockAchievement={handleUnlockAchievement}
              />
            )}

            {currentScreen === 'achievements' && (
              <AchievementsView
                onNavigate={setCurrentScreen}
                achievements={achievements}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. FIXED MOBILE BOTTOM NAVIGATION BAR (Sleek Mobile Dock) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FFFCF7]/95 backdrop-blur-md border-t-2 border-[#E7DCCB] px-3 py-1.5 flex justify-around items-center shadow-[0_-4px_20px_rgba(61,52,47,0.08)]">
        {[
          { id: 'dashboard', label: 'Workshop', icon: Compass, color: 'text-[#E45C75]' },
          { id: 'daily', label: 'Daily', icon: Calendar, color: 'text-[#F2B84B]' },
          { id: 'duel', label: 'Duels', icon: Users, color: 'text-[#F28C6F]' },
          { id: 'leaderboard', label: 'Rankings', icon: Trophy, color: 'text-[#65B9E8]' },
          { id: 'achievements', label: 'Badges', icon: Award, color: 'text-[#8B72C9]' },
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

      {/* 5. FOOTER CREDITS */}
      <footer className="py-8 border-t border-[#E7DCCB]/60 text-center text-xs text-[#998D85] font-display">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Slotword Workshop. All puzzle results pre-committed with cryptographic proof.</p>
          <div className="flex gap-4">
            <button onClick={() => setCurrentScreen('verify')} className="hover:text-[#3D342F] transition-colors">
              Verification Engine
            </button>
            <span>•</span>
            <button onClick={() => setCurrentScreen('achievements')} className="hover:text-[#3D342F] transition-colors">
              Badge Stamps
            </button>
          </div>
        </div>
      </footer>

      {/* 5. TACTILE CARD POUCH DRAWER (Simulated Wallet UI - Section 10) */}
      <AnimatePresence>
        {walletDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-[#3D342F]/40 backdrop-blur-xs">
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setWalletDrawerOpen(false)} />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="relative w-full sm:max-w-sm bg-[#FFFCF7] border-l border-[#E7DCCB] h-full shadow-raised p-4 sm:p-6 flex flex-col justify-between overflow-y-auto"
            >
              <div className="flex flex-col flex-1 min-h-0">
                {/* Header of Drawer */}
                <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-[#E7DCCB] mb-4 sm:mb-6 shrink-0">
                  <div className="flex items-center gap-2 text-[#6F625B]">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[#E7DCCB]" />
                    <span className="font-logo font-extrabold text-[#3D342F] text-base sm:text-lg">Your Card Pouch</span>
                  </div>
                  <motion.button
                    onClick={() => setWalletDrawerOpen(false)}
                    whileTap={{ scale: 0.96 }}
                    className="p-1.5 bg-[#F4EBDD] hover:bg-[#E7DCCB] rounded-lg text-[#3D342F] transition-colors cursor-pointer shrink-0"
                    aria-label="Close card pouch"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Simulated Pouch Card Layout */}
                <div className="bg-[#F4EBDD] border border-[#E7DCCB] rounded-2xl sm:rounded-3xl p-4 sm:p-5 mb-4 sm:mb-6 text-left relative overflow-hidden shadow-xs shrink-0">
                  {/* Faint pattern inside card */}
                  <div className="absolute right-[-20px] top-[-10px] text-4xl sm:text-5xl opacity-5 select-none font-logo pointer-events-none">
                    Slotword
                  </div>

                  <span className="text-[10px] sm:text-xs text-[#6F625B] font-display font-bold uppercase tracking-wider block">
                    Simulated Wallet Balance
                  </span>
                  <div className="text-2xl sm:text-3xl font-logo font-black text-[#3D342F] my-1 font-mono">
                    {wallet.balance.toFixed(5)} SOL
                  </div>
                  
                  <div className="text-[10px] font-mono text-[#998D85] bg-white/55 p-1.5 rounded-lg border border-[#E7DCCB]/60 mt-3 break-all">
                    Address: {wallet.address}
                  </div>
                </div>

                {/* Ledger Receipts Logs */}
                <h4 className="text-[11px] sm:text-xs font-logo font-bold uppercase tracking-wider text-[#6F625B] text-left mb-2.5 shrink-0">
                  Pouch Ledger Receipts
                </h4>
                
                <div className="space-y-2 max-h-[180px] sm:max-h-[260px] overflow-y-auto pr-1 flex-1 min-h-[100px]">
                  {walletHistory.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-2.5 sm:p-3 bg-[#FFF9F0] border border-[#E7DCCB]/60 rounded-xl text-xs"
                    >
                      <div className="text-left">
                        <div className="font-logo font-bold text-[#3D342F] text-xs">{log.desc}</div>
                        <div className="text-[10px] text-[#998D85]">{log.time}</div>
                      </div>
                      <div className={`font-mono font-bold text-xs ${log.type === 'plus' ? 'text-[#79B96B]' : 'text-[#E45C75]'}`}>
                        {log.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replenish funds block & Disconnect option */}
              <div className="pt-3 sm:pt-4 border-t border-[#E7DCCB] space-y-2 shrink-0 mt-3">
                <motion.button
                  onClick={handleTopupSimulatedWallet}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-2.5 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Get Testnet SOL (Faucet)</span>
                </motion.button>
                
                <motion.button
                  onClick={handleDisconnectWallet}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-2.5 bg-[#FAF4EA] hover:bg-[#FDECE7] text-[#E45C75] border border-[#E7DCCB] hover:border-[#F28C6F]/40 font-display font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#E45C75] shrink-0" />
                  <span>Disconnect SOL Wallet</span>
                </motion.button>

                <p className="text-[10px] text-center text-[#998D85] leading-relaxed pt-0.5">
                  *Funds are simulated on-device for puzzle verifications. You can reconnect anytime.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. HOW TO PLAY HELP WIDGET FOR YOUNGER AUDIENCE & BEGINNERS */}
      <HowToPlayModal
        isOpen={howToPlayOpen}
        onClose={() => setHowToPlayOpen(false)}
        onStartPlay={() => setCurrentScreen('daily')}
      />

    </div>
  );
}
