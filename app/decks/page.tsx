'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DECKS } from '@/data/vocabulary';
import { getDeckProgress } from '@/lib/storage';

const ICONS_MAP: Record<string, string> = {
  'names-of-allah': 'auto_awesome',
  'section-4': 'auto_stories',
  'section-5': 'edit',
  'section-6': 'palette',
  'section-7': 'restaurant',
  'section-8': 'flight_takeoff',
};

export default function DecksPage() {
  const [deckProgress, setDeckProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const dp: Record<string, number> = {};
    for (const deck of DECKS) {
      dp[deck.id] = getDeckProgress(deck.id, deck.cards.length);
    }
    setDeckProgress(dp);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">All Decks</h1>
        <span className="font-label-md text-label-md text-on-surface-variant">{DECKS.length} decks</span>
      </header>

      <div className="px-container-margin pt-base pb-md space-y-sm">
        {DECKS.map(deck => {
          const pct = deckProgress[deck.id] ?? 0;
          return (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="bg-white rounded-xl p-sm border border-primary/10 tonal-elevation flex items-center gap-sm active:scale-[0.99] transition-transform duration-100"
            >
              <div className="flex-shrink-0 w-14 h-14 bg-surface-container-high rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[28px]">
                  {ICONS_MAP[deck.id] ?? 'style'}
                </span>
              </div>
              <div className="flex-grow min-w-0">
                <h3 className="font-title-md text-title-md text-primary leading-tight truncate">{deck.title}</h3>
                <p className="font-label-md text-[12px] text-on-surface-variant mt-0.5">{deck.cards.length} cards</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="font-label-md text-[11px] text-on-surface-variant">{pct}%</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
