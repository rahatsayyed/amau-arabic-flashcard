'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { DECKS } from '@/data/vocabulary';
import { getUserProgress, getDeckProgress, getLastStudiedDeckId } from '@/lib/storage';

const ICONS_MAP: Record<string, string> = {
  'names-of-allah': 'auto_awesome',
  'section-4': 'auto_stories',
  'section-5': 'edit',
  'section-6': 'palette',
  'section-7': 'restaurant',
  'section-8': 'flight_takeoff',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Laila sa'ida";
  if (h < 12) return 'Sabah al-khair';
  if (h < 17) return "Masa' al-khair";
  return "Laila sa'ida";
}

export default function HomePage() {
  const [progress, setProgress] = useState({ streak: 0, totalCardsReviewed: 0 });
  const [deckProgress, setDeckProgress] = useState<Record<string, number>>({});
  const [featuredDeckId, setFeaturedDeckId] = useState(DECKS[0].id);

  useEffect(() => {
    const p = getUserProgress();
    setProgress({ streak: p.streak, totalCardsReviewed: p.totalCardsReviewed });
    const dp: Record<string, number> = {};
    for (const deck of DECKS) {
      dp[deck.id] = getDeckProgress(deck.id, deck.cards.length);
    }
    setDeckProgress(dp);
    const lastId = getLastStudiedDeckId();
    if (lastId && DECKS.find(d => d.id === lastId)) setFeaturedDeckId(lastId);
  }, []);

  const featuredDeck = DECKS.find(d => d.id === featuredDeckId) ?? DECKS[0];
  const otherDecks = DECKS.filter(d => d.id !== featuredDeck.id).slice(0, 4);

  return (
    <>
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-primary-container text-on-primary tonal-elevation">
        <div className="flex items-center gap-sm">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10">
            <span className="font-bold text-xl">ع</span>
          </div>
          <span className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight">Learn Arabic</span>
        </div>
        <Link
          href="/login"
          className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">person</span>
        </Link>
      </header>

      <main className="px-container-margin">
        {/* Welcome */}
        <section className="mt-base py-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
                AHLAN WA SAHLAN
              </p>
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mt-1">
                {getGreeting()}
              </h1>
            </div>
            {progress.streak > 0 && (
              <div className="bg-tertiary-fixed text-on-tertiary-fixed rounded-xl px-sm py-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  local_fire_department
                </span>
                <span className="font-label-md text-label-md">{progress.streak} Day Streak</span>
              </div>
            )}
          </div>
        </section>

        {/* Featured Deck */}
        <section className="mb-lg">
          <div className="bg-primary-container text-on-primary rounded-xl p-md overflow-hidden relative tonal-elevation">
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary opacity-10 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
              <span className="text-[10px] font-bold tracking-widest bg-white/10 px-2 py-1 rounded-full uppercase">
                Featured Deck
              </span>
              <h2 className="font-headline-lg-mobile text-headline-lg-mobile mt-sm">{featuredDeck.title}</h2>
              <p className="font-body-md text-body-md text-on-primary-container mt-xs">{featuredDeck.description}</p>
              <div className="mt-md space-y-2">
                <div className="flex justify-between font-label-md text-label-md">
                  <span>Progress</span>
                  <span>{deckProgress[featuredDeck.id] ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary-container rounded-full transition-all"
                    style={{ width: `${deckProgress[featuredDeck.id] ?? 0}%` }}
                  />
                </div>
              </div>
              <Link
                href={`/decks/${featuredDeck.id}/study`}
                className="pressable-btn mt-md w-full bg-secondary text-on-secondary py-3 rounded-lg font-label-md text-label-md flex items-center justify-center gap-sm"
              >
                <span>START STUDYING</span>
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Your Decks */}
        <section className="space-y-md mb-lg">
          <div className="flex items-center justify-between">
            <h3 className="font-title-md text-title-md text-primary">Your Decks</h3>
            <Link href="/decks" className="font-label-md text-label-md text-secondary hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-gutter">
            {otherDecks.slice(0, 4).map(deck => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="bg-white rounded-xl p-sm border border-primary/10 tonal-elevation flex flex-col justify-between min-h-[160px] active:scale-[0.98] transition-transform duration-100"
              >
                <div>
                  <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center mb-sm">
                    <span className="material-symbols-outlined text-primary">
                      {ICONS_MAP[deck.id] ?? 'style'}
                    </span>
                  </div>
                  <h4 className="font-title-md text-[16px] leading-tight text-primary">{deck.title}</h4>
                  <p className="font-label-md text-[12px] text-on-surface-variant mt-1">{deck.cards.length} cards</p>
                </div>
                <div className="mt-md">
                  <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full"
                      style={{ width: `${deckProgress[deck.id] ?? 0}%` }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Total Progress card */}
        <section className="mb-lg">
          <div className="bg-surface-container-low border border-primary/5 rounded-xl p-md flex items-center gap-md">
            <div className="flex-shrink-0 w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-tertiary-fixed shadow-sm">
              <span className="material-symbols-outlined text-tertiary text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                workspace_premium
              </span>
            </div>
            <div className="flex-grow">
              <h3 className="font-title-md text-title-md text-primary">Total Progress</h3>
              <p className="font-body-md text-label-md text-on-surface-variant">
                {progress.totalCardsReviewed} cards reviewed
              </p>
            </div>
            <Link
              href="/profile"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-secondary hover:bg-secondary hover:text-white transition-all"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
