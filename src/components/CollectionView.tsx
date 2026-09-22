import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Lock, ShoppingBag } from 'lucide-react';
import type { ScreenType, ShopItem, StickerRarity } from '../types';
import { SHOP_CATALOG, RARITY_STYLES } from '../types';

interface CollectionViewProps {
  onNavigate: (screen: ScreenType) => void;
  ownedStickers: string[];
}

export default function CollectionView({ onNavigate, ownedStickers }: CollectionViewProps) {
  const rarityOrder: StickerRarity[] = ['legendary', 'epic', 'rare', 'common'];

  const grouped = rarityOrder.map(r => {
    const items = SHOP_CATALOG.filter(i => i.rarity === r && i.type === 'sticker');
    const owned = items.filter(i => ownedStickers.includes(i.id));
    return { rarity: r, items, owned };
  });

  const totalItems = SHOP_CATALOG.filter(i => i.type === 'sticker').length;
  const totalOwned = SHOP_CATALOG.filter(i => i.type === 'sticker' && ownedStickers.includes(i.id)).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-1.5 -ml-1 px-2.5 py-2.5 text-[#6F625B] hover:text-[#3D342F] transition-colors text-sm font-display font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="px-3 py-1.5 bg-[#FAF4EA] border border-[#EADFCB] rounded-full">
          <span className="font-mono text-sm font-bold text-[#3D342F]">{totalOwned}/{totalItems}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-[#8B72C9]" />
        <h1 className="text-2xl font-logo font-extrabold text-[#3D342F]">Sticker Book</h1>
      </div>

      {/* Collection progress */}
      <div className="mb-6 p-4 bg-[#F0ECFA] border border-[#E0D8F5] rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-display font-bold text-[#7155B5]">Collection Progress</span>
          <span className="font-mono text-xs font-bold text-[#3D342F]">
            {Math.round((totalOwned / Math.max(totalItems, 1)) * 100)}%
          </span>
        </div>
        <div className="h-2.5 bg-white/60 border border-[#E0D8F5] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#8B72C9] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(totalOwned / Math.max(totalItems, 1)) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      {/* Grouped by rarity */}
      <div className="space-y-6">
        {grouped.map(group => {
          const style = RARITY_STYLES[group.rarity];
          return (
            <div key={group.rarity}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-xs font-display font-extrabold uppercase tracking-wider ${style.color}`}>
                  {style.label}
                </h3>
                <span className="font-mono text-[10px] text-[#998D85]">
                  {group.owned.length}/{group.items.length}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {group.items.map((item: ShopItem) => {
                  const owned = ownedStickers.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center ${
                        owned
                          ? `${style.bg} ${style.border} ${style.glow}`
                          : 'bg-[#FAF4EA] border-[#EADFCB]'
                      }`}
                    >
                      {owned ? (
                        <>
                          <span className="text-2xl sm:text-3xl">{item.emoji}</span>
                          <span className="text-[8px] sm:text-[9px] font-display font-bold text-[#6F625B] mt-0.5 text-center px-0.5 leading-tight">
                            {item.name}
                          </span>
                        </>
                      ) : (
                        <span className="w-7 h-7 rounded-lg bg-[#F4EBDD] border border-[#E7DCCB] flex items-center justify-center">
                          <Lock className="w-3.5 h-3.5 text-[#998D85]" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {totalOwned === 0 && (
        <div className="mt-6 p-5 bg-[#FAF4EA] border border-dashed border-[#EADFCB] rounded-2xl text-center">
          <ShoppingBag className="w-6 h-6 text-[#A69485] mx-auto mb-2" />
          <p className="text-sm text-[#6F625B] font-display">
            Your sticker book is empty! Visit the shop to start collecting.
          </p>
          <button
            onClick={() => onNavigate('shop')}
            className="mt-3 px-4 py-3 bg-[#E45C75] hover:bg-[#D34B64] text-white text-xs font-display font-bold rounded-xl cursor-pointer transition-colors"
          >
            Go to Shop
          </button>
        </div>
      )}
    </div>
  );
}
