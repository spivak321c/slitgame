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
  Zap
} from 'lucide-react';

import { ScreenType, WalletState, Achievement, INITIAL_ACHIEVEMENTS } from './types';
import LandingPage from './components/LandingPage';
import DashboardView from './components/DashboardView';
import DailyPuzzleView from './components/DailyPuzzleView';
import DuelView from './components/DuelView';
import LeaderboardView from './components/LeaderboardView';
import VerificationCenterView from './components/VerificationCenterView';
import AchievementsView from './components/AchievementsView';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');
  
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
    triggerCelebration();
  };

  // Add simulated funds
  const handleTopupSimulatedWallet = () => {
    setWallet(prev => ({ ...prev, balance: prev.balance + 0.02 }));
    setWalletHistory(prev => [
      { desc: 'Top up (Faucet SOL)', amount: '+0.02000 SOL', type: 'plus', time: 'Just now' },
      ...prev,
    ]);
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
      <header className="sticky top-0 z-40 bg-[#FFFCF7]/95 backdrop-blur-md border-b-2 border-[#E7DCCB] px-4 py-3 shadow-[0_2px_12px_rgba(61,52,47,0.02)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          
          {/* Brand & Breathable Nav Left Cluster */}
          <div className="flex items-center gap-8">
            {/* Logo with Baloo 2 typeface */}
            <motion.button
              onClick={() => setCurrentScreen('landing')}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2.5 group cursor-pointer focus:outline-hidden"
            >
              <div className="w-8.5 h-8.5 bg-[#E45C75] rounded-xl flex items-center justify-center font-logo font-bold text-white text-base shadow-[0_3px_0_#AF324B] group-hover:scale-105 group-hover:rotate-[-3deg] transition-all">
                S
              </div>
              <span className="font-logo font-black text-2xl tracking-tight text-[#3D342F] group-hover:text-[#E45C75] transition-colors">
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
          <div className="flex items-center gap-2.5">
            {/* Minimal Mobile Dashboard quick toggle */}
            {currentScreen !== 'landing' && (
              <motion.button
                onClick={() => setCurrentScreen('dashboard')}
                whileTap={{ scale: 0.96 }}
                className="md:hidden p-2 bg-[#FAF4EA] hover:bg-[#FAF4EA]/80 border border-[#E9DCC6] rounded-xl text-[#3D342F] transition-colors cursor-pointer"
                title="Back to Workshop"
              >
                <Compass className="w-4 h-4" />
              </motion.button>
            )}

            {/* Hand-crafted Unified User Status Pill */}
            <div className="flex items-center bg-[#FAF4EA] border border-[#EADFCB] rounded-full p-1 shadow-[0_2px_12px_-4px_rgba(61,52,47,0.06)]">
              {/* Daily Streak Pouch Section */}
              <motion.div
                onClick={() => setCurrentScreen('achievements')}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#FFF2EE] text-[#3D342F] transition-all cursor-pointer group/streak"
                title="Your active puzzle streak"
              >
                <Flame className="w-3.5 h-3.5 text-[#F28C6F] transition-transform group-hover/streak:scale-110" />
                <span className="font-logo font-black text-xs text-[#3D342F] select-none">{streak}</span>
              </motion.div>

              {/* Precise vertical separator line */}
              <div className="w-[1px] h-4 bg-[#EADFCB] mx-0.5" />

              {/* Wallet/Pouch balance section */}
              {wallet.connected ? (
                <motion.button
                  id="wallet-pouch-btn"
                  onClick={() => setWalletDrawerOpen(true)}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-white active:bg-[#FFFCF7] text-[#3D342F] transition-all group/wallet cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-white border border-[#EADFCB] flex items-center justify-center text-[#6F625B] transition-colors group-hover/wallet:border-[#A69485] group-hover/wallet:bg-[#FFFDF9]">
                    <Wallet className="w-2.5 h-2.5 text-[#6F625B]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-[#4E433C]">{wallet.balance.toFixed(4)} SOL</span>
                </motion.button>
              ) : (
                <motion.button
                  id="connect-wallet-btn"
                  onClick={handleConnectWallet}
                  whileTap={{ scale: 0.96 }}
                  className="px-3.5 py-1.5 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-black text-xs rounded-full transition-colors shadow-sm cursor-pointer"
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
      <main className="flex-1 w-full flex flex-col justify-start relative">
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

      {/* 4. FOOTER CREDITS */}
      <footer className="py-8 border-t border-[#E7DCCB]/60 text-center text-xs text-[#998D85] font-display">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 Slotword Workshop. All results pre-committed and verified on the Solana database.</p>
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
              className="relative w-full max-w-sm bg-[#FFFCF7] border-l-2 border-[#E7DCCB] h-full shadow-raised p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header of Drawer */}
                <div className="flex justify-between items-center pb-4 border-b border-[#E7DCCB] mb-6">
                  <div className="flex items-center gap-2 text-[#6F625B]">
                    <Wallet className="w-5 h-5 text-[#E7DCCB]" />
                    <span className="font-logo font-extrabold text-[#3D342F]">Your Card Pouch</span>
                  </div>
                  <motion.button
                    onClick={() => setWalletDrawerOpen(false)}
                    whileTap={{ scale: 0.96 }}
                    className="p-1.5 bg-[#F4EBDD] hover:bg-[#E7DCCB] rounded-lg text-[#3D342F] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Simulated Pouch Card Layout */}
                <div className="bg-[#F4EBDD] border-2 border-[#E7DCCB] rounded-3xl p-5 mb-6 text-left relative overflow-hidden shadow-sm">
                  {/* Faint pattern inside card */}
                  <div className="absolute right-[-20px] top-[-10px] text-5xl opacity-5 select-none font-logo">
                    Slotword
                  </div>

                  <span className="text-xs text-[#6F625B] font-display font-bold uppercase tracking-wider">
                    Simulated Wallet Balance
                  </span>
                  <div className="text-3xl font-logo font-black text-[#3D342F] my-1 font-mono">
                    {wallet.balance.toFixed(5)} SOL
                  </div>
                  
                  <div className="text-[10px] font-mono text-[#998D85] bg-white/55 p-1.5 rounded-lg border border-[#E7DCCB]/60 mt-4 break-all">
                    Address: {wallet.address}
                  </div>
                </div>

                {/* Ledger Receipts Logs */}
                <h4 className="text-xs font-logo font-bold uppercase tracking-wider text-[#6F625B] text-left mb-3">
                  Pouch Ledger Receipts
                </h4>
                
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {walletHistory.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-3 bg-[#FFF9F0] border border-[#E7DCCB]/60 rounded-xl text-xs"
                    >
                      <div className="text-left">
                        <div className="font-logo font-bold text-[#3D342F]">{log.desc}</div>
                        <div className="text-[10px] text-[#998D85]">{log.time}</div>
                      </div>
                      <div className={`font-mono font-bold ${log.type === 'plus' ? 'text-[#79B96B]' : 'text-[#E45C75]'}`}>
                        {log.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Replenish funds block */}
              <div className="pt-4 border-t border-[#E7DCCB] space-y-3">
                <motion.button
                  onClick={handleTopupSimulatedWallet}
                  whileTap={{ scale: 0.96 }}
                  className="w-full py-3 bg-[#65B9E8] hover:bg-[#4BA8DC] text-white font-display font-bold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Get Testnet SOL (Faucet)
                </motion.button>
                
                <p className="text-[10px] text-center text-[#998D85] leading-relaxed">
                  *Funds are purely simulated on-device for development sandboxing. This contains no actual real-world currency risk.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
