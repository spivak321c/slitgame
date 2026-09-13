import { motion, AnimatePresence } from 'motion/react';
import { Coins, ArrowLeft, ShoppingBag, Gift, Check, PackageOpen } from 'lucide-react';
import { useState } from 'react';
import type { ScreenType, ShopItem, StickerRarity } from '../types';
import { SHOP_CATALOG, RARITY_STYLES, MYSTERY_BOX_PRICE, MYSTERY_BOX_ODDS } from '../types';
import type { PlayerProfile } from '../types';

interface ShopViewProps {
  onNavigate: (screen: ScreenType) => void;
  profile: PlayerProfile;
  ownedStickers: string[];
  onBuy: (item: ShopItem) => void;
  onBuyMysteryBox: () => void;
}

type Tab = 'all' | 'sticker' | 'mascot';

export default function ShopView({
  onNavigate,
  profile,
  ownedStickers,
  onBuy,
  onBuyMysteryBox,
}: ShopViewProps) {
  const [tab, setTab] = useState<Tab>('all');

  const filtered = tab === 'all'
    ? SHOP_CATALOG
    : SHOP_CATALOG.filter(i => i.type === tab);

  const rarityOrder: StickerRarity[] = ['legendary', 'epic', 'rare', 'common'];
  const grouped = rarityOrder.map(r => ({
    rarity: r,
    items: filtered.filter(i => i.rarity === r),
  })).filter(g => g.items.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 text-[#6F625B] hover:text-[#3D342F] transition-colors text-sm font-display font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF4EA] border border-[#EADFCB] rounded-full">
          <Coins className="w-4 h-4 text-[#F2B84B]" />
          <span className="font-mono text-sm font-bold text-[#3D342F]">{profile.coins}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="w-5 h-5 text-[#E45C75]" />
        <h1 className="text-2xl font-logo font-extrabold text-[#3D342F]">Sticker Shop</h1>
      </div>

      {/* Mystery Box */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[28px] p-5 mb-6 bg-gradient-to-br from-[#F0ECFA] to-[#FFF3D6] border-2 border-[#8B72C9]/30 shadow-[0_4px_20px_-4px_rgba(139,114,201,0.15)]"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-8 h-8 rounded-lg bg-white/70 border border-[#8B72C9]/30 flex items-center justify-center text-[#8B72C9]">
                <PackageOpen className="w-4.5 h-4.5" />
              </span>
              <h3 className="font-logo font-extrabold text-base text-[#3D342F]">Mystery Box</h3>
            </div>
            <p className="text-xs text-[#6F625B] font-display mb-2">
              A surprise sticker! Odds are shown — no blind boxes here.
            </p>
            {/* Disclosed odds */}
            <div className="flex flex-wrap gap-1.5">
              {MYSTERY_BOX_ODDS.map(odd => {
                const style = RARITY_STYLES[odd.rarity];
                return (
                  <span
                    key={odd.rarity}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.color} border ${style.border}`}
                  >
                    {style.label} {Math.round(odd.chance * 100)}%
                  </span>
                );
              })}
            </div>
          </div>
          <motion.button
            onClick={onBuyMysteryBox}
            disabled={profile.coins < MYSTERY_BOX_PRICE}
            whileTap={{ scale: 0.94 }}
            className="shrink-0 flex flex-col items-center justify-center w-24 py-3 bg-[#8B72C9] hover:bg-[#7A5FB5] text-white rounded-2xl shadow-[0_3px_0_#5A4599] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Gift className="w-5 h-5 mb-0.5" />
            <span className="font-mono text-xs font-bold flex items-center gap-1">{MYSTERY_BOX_PRICE} <Coins className="w-3.5 h-3.5 text-[#F2B84B]" /></span>
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([
          { id: 'all' as Tab, label: 'All' },
          { id: 'sticker' as Tab, label: 'Stickers' },
          { id: 'mascot' as Tab, label: 'Mascot' },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-display font-bold transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-[#3D342F] text-white'
                : 'bg-[#FAF4EA] text-[#6F625B] border border-[#EADFCB]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Catalog grouped by rarity */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="space-y-5"
        >
          {grouped.map(group => {
            const style = RARITY_STYLES[group.rarity];
            return (
              <div key={group.rarity}>
                <h3 className={`text-xs font-display font-extrabold uppercase tracking-wider mb-2 ${style.color}`}>
                  {style.label}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {group.items.map(item => {
                    const owned = ownedStickers.includes(item.id);
                    const canAfford = profile.coins >= item.price;
                    return (
                      <motion.div
                        key={item.id}
                        whileHover={owned || !canAfford ? undefined : { y: -2 }}
                        className={`relative rounded-2xl p-3 border-2 ${style.bg} ${style.border} ${style.glow} flex flex-col items-center`}
                      >
                        {owned && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#79B96B] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className="text-3xl mb-1.5">{item.emoji}</span>
                        <span className="text-[11px] font-display font-bold text-[#3D342F] text-center mb-2 leading-tight">
                          {item.name}
                        </span>
                        {owned ? (
                          <div className="text-[10px] font-display font-bold text-[#79B96B] py-1">
                            Owned
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => onBuy(item)}
                            disabled={!canAfford}
                            whileTap={{ scale: 0.94 }}
                            className="w-full py-1.5 bg-white/80 hover:bg-white border border-[#EADFCB] rounded-lg flex items-center justify-center gap-1 transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Coins className="w-3 h-3 text-[#F2B84B]" />
                            <span className="font-mono text-[11px] font-bold text-[#3D342F]">{item.price}</span>
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-[10px] text-[#998D85] font-display">
        Coins are fun-only — no real money. Win puzzles and duels to earn more!
      </p>
    </div>
  );
}
