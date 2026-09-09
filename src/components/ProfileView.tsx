import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Link2, Pencil, Lock, CheckCircle2, Coins, Gamepad2, Swords, Award, Zap, Shield, Star, Trophy } from 'lucide-react';
import { ScreenType, Achievement, PlayerProfile, levelFromXp, levelTitle, DIFFICULTIES } from '../types';
import { sound } from '../utils/audio';

interface ProfileViewProps {
  onNavigate: (screen: ScreenType) => void;
  profile: PlayerProfile;
  achievements: Achievement[];
  onUpdateProfile: (patch: Partial<PlayerProfile>) => void;
  onOpenPouch: () => void;
}

const BADGE_ICONS: Record<Achievement['iconType'], typeof Award> = {
  'tile': Award,
  'bolt': Zap,
  'shield': Shield,
  'coins': Coins,
  'star': Star,
};

const AVATAR_OPTIONS = ['🥇', '🦊', '🐻', '🦉', '🐸'];

export default function ProfileView({
  onNavigate,
  profile,
  achievements,
  onUpdateProfile,
  onOpenPouch,
}: ProfileViewProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(profile.username);
  const [draftAvatar, setDraftAvatar] = useState(profile.avatar);
  const [shared, setShared] = useState(false);

  const earned = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);
  const level = levelFromXp(profile.xp);
  const profileLink = `slotword.app/u/${profile.username.toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'solver'}`;

  const startEdit = () => {
    sound.playKeyPress();
    setDraftName(profile.username);
    setDraftAvatar(profile.avatar);
    setEditing(true);
  };

  const saveEdit = () => {
    sound.playKeyEnter();
    const cleaned = draftName.trim().replace(/^@+/, '');
    onUpdateProfile({ username: cleaned || 'paperpilot', avatar: draftAvatar });
    setEditing(false);
  };

  const shareProfile = () => {
    sound.playKeyPress();
    const link = `https://${profileLink}`;
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch {
        /* noop */
      }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).catch(fallback);
    } else {
      fallback();
    }
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-5 text-left">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-xs font-display font-bold text-[#A69485] hover:text-[#3D342F] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </button>
        <span className="text-xs text-[#998D85] font-mono">Your Profile</span>
      </div>

      {/* Profile Banner Card */}
      <div className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-[24px] p-5 sm:p-6 shadow-raised">
        <div className="flex items-center gap-3.5">
          <motion.div
            whileTap={{ scale: 0.94 }}
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFD98F] to-[#F2B64B] border border-[#EAD9A8] flex items-center justify-center text-2xl select-none shadow-sm shrink-0 cursor-pointer"
            title="Tap to change photo"
            onClick={startEdit}
          >
            {profile.avatar}
          </motion.div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-logo font-extrabold text-base text-[#3D342F] truncate">
                @{profile.username}
              </span>
              <span className="bg-[#F0ECFA] text-[#8B72C9] text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border border-[#E0D8F5]">
                Lv {level.level} · {levelTitle(level.level)}
              </span>
            </div>
            <div className="font-mono text-[10.5px] text-[#998D85] mt-0.5 truncate">
              {profileLink}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="font-mono text-[10px] text-[#998D85] uppercase tracking-wider">Pouch</div>
            <div className="font-mono text-sm font-extrabold text-[#D99B28] inline-flex items-center gap-1">
              <span>{profile.coins}</span>
              <Coins className="w-3.5 h-3.5 text-[#D99B28]" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <motion.button
            onClick={startEdit}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_2px_0_#AF324B] transition-all cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit profile
          </motion.button>
          <motion.button
            onClick={() => {
              sound.playKeyPress();
              onOpenPouch();
            }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FAF4EA] hover:bg-[#F4EBDD] border border-[#E7DCCB] text-[#3D342F] font-display font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-[#F2B84B]" />
            Open coin pouch
          </motion.button>
          <motion.button
            onClick={shareProfile}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#FAF4EA] hover:bg-[#F4EBDD] border border-[#E7DCCB] text-[#3D342F] font-display font-extrabold text-xs rounded-xl transition-all cursor-pointer"
          >
            {shared ? <Check className="w-3.5 h-3.5 text-[#79B96B]" /> : <Link2 className="w-3.5 h-3.5 text-[#65B9E8]" />}
            {shared ? 'Copied!' : 'Share profile'}
          </motion.button>
        </div>

        {/* Inline Edit Panel */}
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-3.5 bg-[#FDF7EC] border border-[#EADFCB] rounded-2xl space-y-3">
              <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[#998D85] font-bold">
                Edit profile
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-[#998D85] font-bold">Photo:</span>
                {AVATAR_OPTIONS.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      sound.playKeyPress();
                      setDraftAvatar(opt);
                    }}
                    className={`w-9 h-9 rounded-xl text-lg border flex items-center justify-center transition-all cursor-pointer ${
                      draftAvatar === opt
                        ? 'bg-[#FFF3D6] border-[#F2C974] shadow-[0_2px_0_#E5B74E]'
                        : 'bg-white border-[#E7DCCB] hover:bg-[#FAF4EA]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#998D85] font-bold shrink-0">Username:</span>
                <input
                  type="text"
                  value={draftName}
                  onChange={e => setDraftName(e.target.value.replace(/^@+/, ''))}
                  placeholder="paperpilot"
                  maxLength={16}
                  className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-[#E7DCCB] font-mono text-xs font-semibold bg-white focus:outline-none focus:border-[#F28C6F] focus:ring-2 focus:ring-[#FDECE7]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="px-4 py-2 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-xs rounded-xl shadow-[0_2px_0_#AF324B] transition-all cursor-pointer"
                >
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playKeyPress();
                    setEditing(false);
                  }}
                  className="px-4 py-2 bg-white border border-[#E7DCCB] text-[#6F625B] font-display font-extrabold text-xs rounded-xl hover:bg-[#FAF4EA] transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Stats Card */}
      <div className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-[24px] p-5 sm:p-6 shadow-raised space-y-4">
        <h3 className="font-logo font-extrabold text-sm text-[#3D342F]">Stats & Records</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-[#FCE8EC] border border-[#F5C9D3] rounded-2xl text-center">
            <Gamepad2 className="w-4 h-4 text-[#E45C75] mx-auto mb-1.5" />
            <div className="font-logo font-black text-lg text-[#3D342F]">{profile.gamesPlayed}</div>
            <div className="text-[10px] font-mono text-[#998D85] uppercase tracking-wide">Puzzles played</div>
          </div>
          <div className="p-3.5 bg-[#EAF5E7] border border-[#BFE3C9] rounded-2xl text-center">
            <CheckCircle2 className="w-4 h-4 text-[#79B96B] mx-auto mb-1.5" />
            <div className="font-logo font-black text-lg text-[#3D342F]">{profile.gamesWon}</div>
            <div className="text-[10px] font-mono text-[#998D85] uppercase tracking-wide">Puzzles solved</div>
          </div>
          <div className="p-3.5 bg-[#FDECE7] border border-[#FADCD5] rounded-2xl text-center">
            <Swords className="w-4 h-4 text-[#F28C6F] mx-auto mb-1.5" />
            <div className="font-logo font-black text-lg text-[#3D342F]">{profile.duelsPlayed}</div>
            <div className="text-[10px] font-mono text-[#998D85] uppercase tracking-wide">Duels fought</div>
          </div>
          <div className="p-3.5 bg-[#FFF3D6] border border-[#F2C974] rounded-2xl text-center">
            <Trophy className="w-4 h-4 text-[#F2B84B] mx-auto mb-1.5" />
            <div className="font-logo font-black text-lg text-[#3D342F]">{profile.duelsWon}</div>
            <div className="text-[10px] font-mono text-[#998D85] uppercase tracking-wide">Duels won</div>
          </div>
        </div>

        {/* Best attempts per difficulty */}
        <div className="space-y-2">
          {DIFFICULTIES.map(cfg => (
            <div key={cfg.id} className="flex items-center justify-between bg-[#FAF4EA] border border-[#EADFCB] rounded-2xl px-3.5 py-2.5">
              <div>
                <span className="font-logo font-bold text-xs text-[#3D342F]">{cfg.label}</span>
                <span className="text-[10px] text-[#998D85] font-mono ml-2">{cfg.wordLength} letters · {cfg.attempts} tries</span>
              </div>
              <span className="font-mono text-xs font-bold text-[#6F625B]">
                Best: {profile.bestAttempts[cfg.id] === null ? '—' : `${profile.bestAttempts[cfg.id]} tries`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Badge Case */}
      <div className="bg-[#FFFCF7] border-2 border-[#E7DCCB] rounded-[24px] p-5 sm:p-6 shadow-raised space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-logo font-extrabold text-sm text-[#3D342F]">
            Badge Case ({earned.length} of {achievements.length} unlocked)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Earned Badges */}
          {earned.map(badge => (
            <div
              key={badge.id}
              className="p-3.5 bg-[#FFFDF5] border border-[#F2C974] rounded-2xl space-y-1.5 relative overflow-hidden"
            >
              <div className="absolute right-[-14px] top-[-14px] w-16 h-16 bg-[#FFF3D6] rounded-full opacity-60" />
              <div className="flex items-center justify-between relative">
                <span className="font-logo font-bold text-xs text-[#3D342F] flex items-center gap-1.5">
                  {(() => {
                    const Icon = BADGE_ICONS[badge.iconType];
                    return <Icon className="w-4 h-4 text-[#8B72C9]" strokeWidth={2.25} />;
                  })()}
                  {badge.title}
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#79B96B]" />
              </div>
              <p className="text-[11px] text-[#6F625B] leading-snug relative">
                {badge.description}
              </p>
              <span className="text-[9px] font-mono text-[#79B96B] font-bold block relative">
                UNLOCKED{badge.unlockedAt ? ` · ${badge.unlockedAt}` : ''}
              </span>
            </div>
          ))}

          {/* Locked Badges with criteria */}
          {locked.map(badge => (
            <div
              key={badge.id}
              className="p-3.5 bg-[#FAF4EA] border border-dashed border-[#DCCFB8] rounded-2xl space-y-1.5 opacity-80"
            >
              <div className="flex items-center justify-between">
                <span className="font-logo font-bold text-xs text-[#998D85] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-[#A69485]" />
                  {badge.title}
                </span>
                <span className="text-[9px] font-mono font-bold bg-[#EADFCB] text-[#6F625B] px-1.5 py-0.5 rounded-full">
                  LOCKED
                </span>
              </div>
              <p className="text-[11px] text-[#998D85] leading-snug">
                {badge.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}