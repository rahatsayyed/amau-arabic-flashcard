'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDeckById } from '@/data/vocabulary';
import { saveCardReview, getDueCards } from '@/lib/storage';
import { fsrs, Rating, formatInterval } from '@/lib/fsrs';
import { createEmptyCard } from 'ts-fsrs';

type Phase = 'loading' | 'study' | 'done';

interface SessionCard {
  cardId: string;
  arabic: string;
  meaning: string;
  category?: string;
}

export default function StudySessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const deck = getDeckById(id);

  const [phase, setPhase] = useState<Phase>('loading');
  const [queue, setQueue] = useState<SessionCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [intervals, setIntervals] = useState<string[]>(['1 min', '1 day', '4 days']);

  useEffect(() => {
    if (!deck) return;
    const dueIds = getDueCards(id, deck.cards.map(c => c.id));
    const shuffled = [...dueIds].sort(() => Math.random() - 0.5).slice(0, 20);
    const sessionCards: SessionCard[] = shuffled.map(cardId => {
      const card = deck.cards.find(c => c.id === cardId)!;
      return { cardId, arabic: card.arabic, meaning: card.meaning, category: deck.title };
    });
    setQueue(sessionCards);
    setPhase(sessionCards.length > 0 ? 'study' : 'done');
  }, [id, deck]);

  useEffect(() => {
    if (!deck || queue.length === 0 || current >= queue.length) return;
    const emptyCard = createEmptyCard();
    const record = fsrs.repeat(emptyCard, new Date());
    setIntervals([
      formatInterval(record[Rating.Again].card.scheduled_days || 0),
      formatInterval(record[Rating.Good].card.scheduled_days || 1),
      formatInterval(record[Rating.Easy].card.scheduled_days || 4),
    ]);
  }, [current, queue, deck]);

  const handleFlip = () => setFlipped(f => !f);

  const handleRate = (rating: 1 | 3 | 4) => {
    const card = queue[current];
    saveCardReview(id, card.cardId, rating as Rating, fsrs);
    if (rating >= 3) setCorrect(c => c + 1);
    setReviewed(r => r + 1);
    setFlipped(false);
    if (current + 1 >= queue.length) {
      setPhase('done');
    } else {
      setCurrent(c => c + 1);
    }
  };

  if (!deck) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Deck not found</p>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Loading session...</p>
      </div>
    );
  }

  if (phase === 'done') {
    const pct = queue.length > 0 ? Math.round((correct / queue.length) * 100) : 100;
    return (
      <>
        <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-title-md text-title-md text-primary">Session Complete</h1>
          <div className="w-10" />
        </header>

        <div className="flex flex-col items-center justify-center px-container-margin py-lg">
          <div
            className="w-36 h-36 rounded-full flex items-center justify-center mb-md"
            style={{ background: `conic-gradient(#b32914 ${pct * 3.6}deg, #e4e2dd 0)` }}
          >
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
              <span className="font-display-lg text-display-lg text-primary">{pct}%</span>
            </div>
          </div>

          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2">
            {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : 'Keep going!'}
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant text-center mb-lg">
            {reviewed} cards reviewed · {correct} correct
          </p>

          <div className="w-full space-y-sm">
            <Link
              href={`/decks/${id}/study`}
              className="w-full h-14 bg-secondary text-on-secondary flex items-center justify-center rounded-xl font-label-md text-label-md pressable-btn"
            >
              Study Again
            </Link>
            <Link
              href={`/decks/${id}`}
              className="w-full h-14 bg-surface-container text-primary flex items-center justify-center rounded-xl font-label-md text-label-md"
            >
              Back to Deck
            </Link>
          </div>
        </div>
      </>
    );
  }

  const card = queue[current];
  const progressPct = (current + 1) / queue.length;

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors active:opacity-80"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Learn Arabic</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-primary">more_vert</span>
        </button>
      </header>

      <div className="subtle-pattern flex flex-col items-center px-container-margin pt-md pb-lg">
        {/* Progress bar */}
        <div className="w-full mb-lg space-y-2">
          <div className="flex justify-between items-end">
            <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
              Session Progress
            </span>
            <span className="font-label-md text-label-md text-primary font-bold">
              {current + 1} / {queue.length}
            </span>
          </div>
          <div className="h-2 w-full bg-primary-container/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-secondary-container rounded-full transition-all duration-500"
              style={{ width: `${progressPct * 100}%` }}
            />
          </div>
        </div>

        {/* Flashcard */}
        <div
          className={`relative w-full cursor-pointer ${flipped ? 'flip-card-active' : ''}`}
          onClick={handleFlip}
          style={{ perspective: '1000px', aspectRatio: '3/4' }}
        >
          <div className="flip-card-inner relative w-full h-full">
            {/* Front */}
            <div className="flip-card-front absolute inset-0 bg-surface-container-lowest rounded-[2rem] border border-primary/10 shadow-[0_4px_12px_rgba(23,54,59,0.04)] flex flex-col items-center justify-center p-md text-center">
              <div className="absolute top-8 left-8">
                <span className="font-label-md text-label-md text-on-surface-variant/40 uppercase">
                  {card.category}
                </span>
              </div>
              <span className="font-arabic-display text-arabic-display text-primary arabic-text arabic-glow select-none">
                {card.arabic}
              </span>
              <div className="absolute bottom-8 font-body-md text-body-md text-on-surface-variant/60 italic">
                Tap to reveal meaning
              </div>
            </div>

            {/* Back */}
            <div className="flip-card-back absolute inset-0 bg-primary-container rounded-[2rem] border border-primary shadow-[0_12px_24px_rgba(23,54,59,0.15)] flex flex-col items-center justify-center p-md text-center">
              <span className="font-display-lg text-display-lg text-on-primary mb-2">{card.meaning}</span>
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
          {/* Again */}
          <button className="flex flex-col items-center gap-1 group" onClick={() => handleRate(1)} disabled={!flipped}>
            <div className={`w-full h-14 flex items-center justify-center rounded-xl font-label-md text-label-md transition-all ${
              flipped
                ? 'bg-secondary text-on-secondary shadow-[0_2px_0_#8f1000] active:shadow-none active:translate-y-0.5'
                : 'bg-surface-container text-on-surface-variant opacity-50'
            }`}>
              Again
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
              {intervals[0]}
            </span>
          </button>

          {/* Good */}
          <button className="flex flex-col items-center gap-1" onClick={() => handleRate(3)} disabled={!flipped}>
            <div className={`w-full h-14 flex items-center justify-center rounded-xl font-label-md text-label-md transition-all ${
              flipped
                ? 'bg-tertiary-container text-on-tertiary-container shadow-[0_2px_0_#2f1500] active:shadow-none active:translate-y-0.5'
                : 'bg-surface-container text-on-surface-variant opacity-50'
            }`}>
              Good
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
              {intervals[1]}
            </span>
          </button>

          {/* Easy */}
          <button className="flex flex-col items-center gap-1" onClick={() => handleRate(4)} disabled={!flipped}>
            <div className={`w-full h-14 flex items-center justify-center rounded-xl font-label-md text-label-md transition-all ${
              flipped
                ? 'bg-primary-container text-on-primary-container shadow-[0_2px_0_#001f24] active:shadow-none active:translate-y-0.5'
                : 'bg-surface-container text-on-surface-variant opacity-50'
            }`}>
              Easy
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-tighter">
              {intervals[2]}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
