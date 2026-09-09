import React from 'react';
import { Key } from 'lucide-react';

interface AttemptKeysProps {
  maxAttempts?: number;
  usedAttempts: number;
}

export default function AttemptKeys({
  maxAttempts = 6,
  usedAttempts,
}: AttemptKeysProps) {
  const keysLeft = Math.max(0, maxAttempts - usedAttempts);

  return (
    <div
      className="flex items-center justify-center gap-2 py-2 px-3 bg-[#FFFCF7] border border-[#E7DCCB] rounded-xl shadow-sm"
      role="img"
      aria-label={`${keysLeft} ${keysLeft === 1 ? 'attempt key left' : `attempt keys left`}`}
    >
      <div className="flex items-center gap-1.5">
        {Array.from({ length: maxAttempts }).map((_, index) => {
          const isRemaining = index < keysLeft;
          return (
            <div
              key={index}
              title={isRemaining ? `Key #${index + 1} Available` : `Key #${index + 1} Used`}
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all duration-300 ${
                isRemaining
                  ? 'bg-[#FFF3D6] border border-[#F2B84B] text-[#D99B28] scale-100'
                  : 'bg-[#F4EBDD] border border-[#E7DCCB] text-[#AFA8A3] opacity-60 scale-95'
              }`}
            >
              {isRemaining ? (
                <Key className="w-4 h-4 stroke-[2.2]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-[#AFA8A3]" />
              )}
            </div>
          );
        })}
      </div>
      <span className="text-xs font-semibold text-[#6F625B] font-mono ml-1">
        {keysLeft} {keysLeft === 1 ? 'key' : 'keys'} left
      </span>
    </div>
  );
}