'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getDeckById } from '@/data/vocabulary';
import { getCardState, getDeckProgress } from '@/lib/storage';

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

  useEffect(() => {
    if (!deck) return;
    setProgress(getDeckProgress(id, deck.cards.length));
    const statuses: Record<string, string> = {};
    for (const card of deck.cards.slice(0, 80)) {
      const state = getCardState(id, card.id);
      statuses[card.id] = getCardStatus(state.card.stability);
    }
    setCardStatuses(statuses);
  }, [id, deck]);

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
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-title-md text-title-md text-primary truncate mx-2">{deck.title}</h1>
        <div className="w-10" />
      </header>

      <div className="px-container-margin pt-base pb-md">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-sm mb-md">
          <div className="bg-surface-container-low p-sm rounded-xl border border-primary/5">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Cards</p>
            <p className="font-title-md text-title-md text-primary mt-1">{deck.cards.length}</p>
          </div>
          <div className="bg-surface-container-low p-sm rounded-xl border border-primary/5">
            <p className="font-label-md text-label-md text-on-surface-variant uppercase">Mastery</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-title-md text-title-md text-primary">{progress}%</p>
              <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-secondary-container" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Start Studying — above word list, per Stitch design */}
        <div className="mb-lg">
          <Link
            href={`/decks/${id}/study`}
            className="w-full h-14 bg-secondary-container text-on-secondary flex items-center justify-center gap-sm rounded-xl shadow-lg border-b-4 border-secondary hover:scale-[1.02] active:scale-95 transition-all duration-200 font-label-md text-label-md"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            <span className="uppercase tracking-wider">Start Studying</span>
          </Link>
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-sm border-b border-primary/10 pb-2">
          <h3 className="font-title-md text-title-md text-primary flex items-center gap-2">
            <span className="w-1.5 h-5 bg-primary-container rounded-full" />
            Vocabulary ({vocabCards.length})
          </h3>
          {sentenceCards.length > 0 && (
            <span className="font-label-md text-[12px] text-on-surface-variant">+ {sentenceCards.length} sentences</span>
          )}
        </div>

        {/* Word list */}
        <div className="space-y-2 mb-md">
          {deck.cards.slice(0, 80).map(card => {
            const status = cardStatuses[card.id] ?? 'new';
            return (
              <div
                key={card.id}
                className="bg-surface p-sm rounded-xl border border-primary/5 tonal-elevation flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span
                    className="font-arabic-body text-arabic-body text-primary arabic-text"
                  >
                    {card.arabic}
                  </span>
                  {card.type === 'sentence' && (
                    <span className="font-label-md text-[11px] text-on-surface-variant">sentence</span>
                  )}
                </div>
                <div className="text-right ml-2">
                  <span className="font-body-md text-body-md font-semibold text-primary block">{card.meaning}</span>
                  <span className={`font-label-md text-[11px] capitalize ${STATUS_COLOR[status] ?? 'text-on-surface-variant'}`}>
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
