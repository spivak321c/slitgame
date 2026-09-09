import { useState, useEffect } from 'react';
import { Swords, Coins, X } from 'lucide-react';
import { motion } from 'motion/react';
import { DuelRoom } from '../data/duelRooms';
import { sound } from '../utils/audio';

interface CreateDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (room: DuelRoom) => void;
  initialStake?: number | null;
}

const PRESET_STAKES = [20, 50, 100, 200];

export default function CreateDuelModal({ isOpen, onClose, onCreateRoom, initialStake }: CreateDuelModalProps) {
  const [selectedStake, setSelectedStake] = useState<number | null>(initialStake ?? null);
  const [customStake, setCustomStake] = useState('');
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedStake(initialStake ?? null);
      setCustomStake('');
      setCreated(false);
    }
  }, [isOpen, initialStake]);

  if (!isOpen) return null;

  const getActiveStake = (): number => {
    if (selectedStake !== null) return selectedStake;
    const parsed = parseInt(customStake, 10);
    return !isNaN(parsed) && parsed > 0 ? parsed : 0;
  };

  const handleCreate = () => {
    const stake = getActiveStake();
    if (stake <= 0) return;
    sound.playKeyEnter();

    const roomId = `room_${Math.random().toString(36).slice(2, 10)}`;
    const minutes = stake >= 100 ? 10 : 5;

    onCreateRoom({
      id: roomId,
      host: {
        id: 'me',
        name: 'You (Solver)',
        level: 'Room Host',
        avatar: '🧑',
        accuracy: 0.8,
        speedSeconds: 100,
      },
      handle: '@you',
      stake,
      minutes,
      slices: 0,
      sliceTotal: 6,
      isYours: true,
    });

    setCreated(true);
  };

  const activeStake = getActiveStake();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3D342F]/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-[#FFFCF7] border border-[#E9DCC6] rounded-[24px] shadow-raised p-6 text-left"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#E7DCCB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDECE7] text-[#F28C6F] flex items-center justify-center">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-logo font-extrabold text-lg text-[#3D342F] leading-none">
                Set up a staked duel
              </h3>
              <p className="text-[11px] text-[#6F625B] mt-0.5">Pick your coin stake and play on this device</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#998D85] hover:text-[#3D342F] p-1.5 rounded-xl hover:bg-[#FAF4EA] cursor-pointer"
            aria-label="Close create duel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {created ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto bg-[#EAF5E7] text-[#79B96B] rounded-full flex items-center justify-center">
              <Swords className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="font-logo font-extrabold text-xl text-[#3D342F]">Match Ready</h4>
              <p className="text-xs text-[#6F625B] mt-1">
                Staked <strong className="font-mono text-[#3D342F] inline-flex items-center gap-1">{activeStake}<Coins className="w-3 h-3 text-[#F2B84B]" /></strong> · winner takes the pot. Real opponents arrive with the backend — for now it's you vs a practice rival.
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-[#E45C75] hover:bg-[#D34B64] text-white font-display font-extrabold text-sm rounded-2xl shadow-[0_3px_0_#AF324B] transition-all cursor-pointer active:scale-[0.98]"
              >
                Open Duel Arena
              </button>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div>
              <label className="font-mono text-[10.5px] font-bold text-[#998D85] uppercase tracking-wider block mb-2.5">
                Stake amount
              </label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {PRESET_STAKES.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      sound.playKeyPress();
                      setSelectedStake(amt);
                      setCustomStake('');
                    }}
                    className={`py-2.5 rounded-xl font-logo font-extrabold text-sm border transition-all cursor-pointer ${
                      selectedStake === amt
                        ? 'bg-[#E45C75] text-white border-[#E45C75] shadow-[0_2px_0_#AF324B]'
                        : 'bg-[#FFFCF7] text-[#3D342F] border-[#E7DCCB] hover:bg-[#FAF4EA]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">{amt}<Coins className="w-3 h-3 text-[#F2B84B]" /></span>
                  </button>
                ))}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-[11px] font-mono font-bold text-[#998D85] pointer-events-none">
                  Custom:
                </span>
                <input
                  type="number"
                  value={customStake}
                  onChange={e => {
                    setCustomStake(e.target.value);
                    setSelectedStake(null);
                  }}
                  placeholder="Enter coin amount..."
                  className="w-full pl-20 pr-3 py-2.5 border border-[#E7DCCB] rounded-xl font-mono text-xs bg-white focus:outline-none focus:border-[#F28C6F] focus:ring-2 focus:ring-[#FDECE7]"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF4EA] border border-[#EADFCB] rounded-2xl text-[11.5px] leading-relaxed text-[#6F625B] space-y-1">
              <div className="flex items-center gap-1.5 font-logo font-bold text-[#3D342F]">
                <Coins className="w-4 h-4 text-[#F2B84B]" /> Coin Pot Rules
              </div>
              <p>
                Winner takes the whole doubled pot of <strong className="font-mono text-[#3D342F] inline-flex items-center gap-1">{activeStake * 2}<Coins className="w-3 h-3 text-[#F2B84B]" /></strong>. Both players solve the same 5-letter word — fastest solver wins. Coins are just for fun.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                disabled={activeStake <= 0}
                onClick={handleCreate}
                className={`w-full py-3.5 px-4 font-display font-extrabold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  activeStake > 0
                    ? 'bg-[#E45C75] hover:bg-[#D34B64] text-white shadow-[0_3px_0_#AF324B] cursor-pointer active:scale-[0.98]'
                    : 'bg-[#F4EBDD] text-[#A69485] cursor-not-allowed'
                }`}
              >
                <Swords className="w-4 h-4" /> Set up match (<span className="inline-flex items-center gap-1">{activeStake}<Coins className="w-3.5 h-3.5 text-[#F2B84B]" /></span>)
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
