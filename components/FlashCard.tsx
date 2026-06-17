'use client';

import { useState } from 'react';

interface FlashCardProps {
  arabic: string;
  meaning: string;
  category?: string;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  intervals?: string[];
  cardNumber: number;
  total: number;
  isFlipped?: boolean;
  onFlip?: () => void;
}

export default function FlashCard({
  arabic,
  meaning,
  category,
  onRate,
  intervals = ['1 min', '1 day', '4 days'],
  cardNumber,
  total,
  isFlipped: externalFlipped,
  onFlip,
}: FlashCardProps) {
  const [localFlipped, setLocalFlipped] = useState(false);
  const isFlipped = externalFlipped !== undefined ? externalFlipped : localFlipped;

  const handleFlip = () => {
    if (onFlip) onFlip();
    else setLocalFlipped(f => !f);
  };

  const progress = cardNumber / total;

  return (
    <div className="flex flex-col items-center w-full px-container-margin">
      {/* Progress */}
      <div className="w-full mb-lg space-y-2">
        <div className="flex justify-between items-end">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
            Session Progress
          </span>
          <span className="font-label-md text-label-md text-primary font-bold">
            {cardNumber} / {total}
          </span>
        </div>
        <div className="h-2 w-full bg-primary-container/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary-container rounded-full transition-all duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className={`relative w-full cursor-pointer ${isFlipped ? 'flip-card-active' : ''}`}
        onClick={handleFlip}
        style={{ perspective: '1000px', aspectRatio: '3/4' }}
      >
        <div className="flip-card-inner relative w-full h-full">
          {/* Front */}
          <div className="flip-card-front absolute inset-0 bg-surface-container-lowest rounded-[2rem] border border-primary/10 shadow-[0_4px_12px_rgba(23,54,59,0.04)] flex flex-col items-center justify-center p-md text-center">
            {category && (
              <div className="absolute top-8 left-8">
                <span className="font-label-md text-label-md text-on-surface-variant/40 uppercase">
                  {category}
                </span>
              </div>
            )}
            <span className="font-arabic-display text-arabic-display text-primary arabic-text arabic-glow select-none">
              {arabic}
            </span>
            <div className="absolute bottom-8 font-body-md text-body-md text-on-surface-variant/60 italic">
              Tap to reveal meaning
            </div>
          </div>

          {/* Back */}
          <div className="flip-card-back absolute inset-0 bg-primary-container rounded-[2rem] border border-primary shadow-[0_12px_24px_rgba(23,54,59,0.15)] flex flex-col items-center justify-center p-md text-center">
            <span className="font-display-lg text-display-lg text-on-primary mb-2">{meaning}</span>
            <div className="mt-12 max-w-[80%] border-t border-on-primary-container/20 pt-6">
              <p className="font-body-md text-body-md text-on-primary-container italic">
                Rate how well you knew this
              </p>
            </div>
            <div className="absolute bottom-8">
              <span className="material-symbols-outlined text-on-primary-container opacity-50">refresh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating buttons */}
      <div className="grid grid-cols-3 gap-sm w-full mt-lg">
        <button className="flex flex-col items-center gap-1" onClick={() => onRate(1)} disabled={!isFlipped}>
          <div className={`w-full h-14 flex items-center justify-center rounded-xl font-label-md text-label-md transition-all ${
            isFlipped
              ? 'bg-secondary text-on-secondary shadow-[0_2px_0_#8f1000] active:shadow-none active:translate-y-0.5'
              : 'bg-surface-container text-on-surface-variant opacity-50'
          }`}>
            Again
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">{intervals[0]}</span>
        </button>

        <button className="flex flex-col items-center gap-1" onClick={() => onRate(3)} disabled={!isFlipped}>
          <div className={`w-full h-14 flex items-center justify-center rounded-xl font-label-md text-label-md transition-all ${
            isFlipped
              ? 'bg-tertiary-container text-on-tertiary-container shadow-[0_2px_0_#2f1500] active:shadow-none active:translate-y-0.5'
              : 'bg-surface-container text-on-surface-variant opacity-50'
          }`}>
            Good
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">{intervals[1]}</span>
        </button>

        <button className="flex flex-col items-center gap-1" onClick={() => onRate(4)} disabled={!isFlipped}>
          <div className={`w-full h-14 flex items-center justify-center rounded-xl font-label-md text-label-md transition-all ${
            isFlipped
              ? 'bg-primary-container text-on-primary-container shadow-[0_2px_0_#001f24] active:shadow-none active:translate-y-0.5'
              : 'bg-surface-container text-on-surface-variant opacity-50'
          }`}>
            Easy
          </div>
          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">{intervals[2]}</span>
        </button>
      </div>
    </div>
  );
}
