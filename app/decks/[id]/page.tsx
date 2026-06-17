'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDeckById } from '@/data/vocabulary';
import { getCardState, getDeckProgress, getDailyGoal, saveDailyGoal } from '@/lib/storage';

function getCardStatus(stability: number): 'new' | 'learning' | 'review' | 'mastered' {
  if (stability === 0) return 'new';
  if (stability < 1) return 'learning';
  if (stability < 5) return 'review';
  return 'mastered';
}

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  learning: 'Learning',
  review: 'Review',
  mastered: '✓ Mastered',
};
const STATUS_COLOR: Record<string, string> = {
  new: 'text-on-surface-variant',
  learning: 'text-on-tertiary-container',
  review: 'text-primary',
  mastered: 'text-secondary',
};

export default function DeckDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const deck = getDeckById(id);
  const [progress, setProgress] = useState(0);
  const [cardStatuses, setCardStatuses] = useState<Record<string, string>>({});
  const [dailyGoal, setDailyGoalState] = useState(20);

  useEffect(() => {
    if (!deck) return;
    setProgress(getDeckProgress(id, deck.cards.length));
    setDailyGoalState(getDailyGoal());
    const statuses: Record<string, string> = {};
    for (const card of deck.cards.slice(0, 80)) {
      const state = getCardState(id, card.id);
      statuses[card.id] = getCardStatus(state.card.stability);
    }
    setCardStatuses(statuses);
  }, [id, deck]);

  const adjustGoal = (delta: number) => {
    const next = Math.max(5, Math.min(50, dailyGoal + delta));
    setDailyGoalState(next);
    saveDailyGoal(next);
  };

  if (!deck) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Deck not found.</p>
      </div>
    );
  }

  const vocabCards = deck.cards.filter(c => c.type === 'vocab');
  const sentenceCards = deck.cards.filter(c => c.type === 'sentence');

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary truncate mx-2">
          {deck.title}
        </h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary">more_vert</span>
        </button>
      </header>

      <div className="px-container-margin pt-base pb-md">

        {/* ── Hero section ────────────────────────────── */}
        <section className="mb-lg">
          {/* Decorative banner using first Arabic word as background motif */}
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-md shadow-sm bg-primary-container">
            <span
              className="absolute inset-0 flex items-center justify-center text-on-primary opacity-5 select-none pointer-events-none arabic-text"
              style={{ fontSize: '120px', lineHeight: 1 }}
              aria-hidden="true"
            >
              {deck.cards[0]?.arabic}
            </span>
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent" />
            {/* badge */}
            <div className="absolute bottom-4 left-4">
              <span className="bg-secondary-container text-on-secondary-fixed px-3 py-1 rounded-full font-label-md text-label-md">
                {progress > 0 ? 'In Progress' : 'Not Started'}
              </span>
            </div>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-xs">
            {deck.title}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            {deck.description}
          </p>
        </section>

        {/* ── Stats bento ─────────────────────────────── */}
        <div className="grid grid-cols-2 gap-sm mb-lg">
          {/* Cards */}
          <div className="bg-surface-container-low p-md rounded-xl border border-primary/5">
            <p className="font-label-md text-label-md text-on-surface-variant mb-xs">CARDS</p>
            <p className="font-title-md text-title-md text-primary">{deck.cards.length} Words</p>
          </div>
          {/* Mastery */}
          <div className="bg-surface-container-low p-md rounded-xl border border-primary/5">
            <p className="font-label-md text-label-md text-on-surface-variant mb-xs">MASTERY</p>
            <div className="flex items-center gap-2">
              <p className="font-title-md text-title-md text-primary">{progress}%</p>
              <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
          {/* Daily Goal — spans full width */}
          <div className="col-span-2 bg-surface-container-low p-md rounded-xl border border-primary/5 flex items-center justify-between">
            <div>
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">DAILY GOAL</p>
              <p className="font-title-md text-title-md text-primary">{dailyGoal} Cards</p>
            </div>
            <div className="flex items-center gap-sm">
              <button
                onClick={() => adjustGoal(-5)}
                disabled={dailyGoal <= 5}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <button
                onClick={() => adjustGoal(5)}
                disabled={dailyGoal >= 50}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Start Studying ──────────────────────────── */}
        <div className="mb-lg">
          <Link
            href={`/decks/${id}/study`}
            className="w-full h-14 bg-secondary-container text-on-secondary flex items-center justify-center gap-sm rounded-xl shadow-lg border-b-4 border-secondary hover:scale-[1.02] active:scale-95 transition-all duration-200 font-label-md text-label-md"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            <span className="uppercase tracking-wider">Start Studying</span>
          </Link>
        </div>

        {/* ── Word list ───────────────────────────────── */}
        <div className="flex items-center justify-between mb-sm border-b border-primary/10 pb-2">
          <h3 className="font-title-md text-title-md text-primary flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary-container rounded-full" />
            Word List
          </h3>
          <span className="font-label-md text-label-md text-on-surface-variant">
            {vocabCards.length} vocab{sentenceCards.length > 0 ? ` · ${sentenceCards.length} sentences` : ''}
          </span>
        </div>

        <div className="space-y-sm mb-md">
          {deck.cards.slice(0, 80).map(card => {
            const status = cardStatuses[card.id] ?? 'new';
            return (
              <div
                key={card.id}
                className="bg-surface p-md rounded-xl border border-primary/5 tonal-elevation flex items-center justify-between hover:bg-surface-container-lowest transition-colors"
              >
                <div className="flex flex-col">
                  <span className="font-arabic-body text-arabic-body text-primary arabic-text leading-tight">
                    {card.arabic}
                  </span>
                  {card.type === 'sentence' && (
                    <span className="font-label-md text-[11px] text-on-surface-variant mt-0.5">sentence</span>
                  )}
                </div>
                <div className="text-right ml-2 flex-shrink-0">
                  <span className="font-body-lg text-body-lg text-primary block">{card.meaning}</span>
                  <span className={`font-label-md text-label-md capitalize ${STATUS_COLOR[status] ?? 'text-on-surface-variant'}`}>
                    {STATUS_LABEL[status] ?? status}
                  </span>
                </div>
              </div>
            );
          })}
          {deck.cards.length > 80 && (
            <p className="text-center font-label-md text-label-md text-on-surface-variant py-2">
              + {deck.cards.length - 80} more cards
            </p>
          )}
        </div>
      </div>
    </>
  );
}
