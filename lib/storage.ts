'use client';

import { FSRS, Card, createEmptyCard, Rating, RecordLog } from 'ts-fsrs';

export interface CardState {
  cardId: string;
  deckId: string;
  card: Card;
  lastReviewed?: string;
}

export interface ExamScore {
  id: string;
  deckId: string;
  score: number;
  total: number;
  date: string;
}

export interface UserProgress {
  streak: number;
  lastStudyDate: string;
  totalCardsReviewed: number;
  cardStates: Record<string, CardState>;
  examScores: ExamScore[];
  activityByDay: Record<string, number>;
}

const STORAGE_KEY = 'amau_progress';
const LAST_DECK_KEY = 'amau_last_deck';

function getProgress(): UserProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return emptyProgress();
}

function emptyProgress(): UserProgress {
  return {
    streak: 0,
    lastStudyDate: '',
    totalCardsReviewed: 0,
    cardStates: {},
    examScores: [],
    activityByDay: {},
  };
}

function saveProgress(p: UserProgress) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function getCardState(deckId: string, cardId: string): CardState {
  const p = getProgress();
  const key = `${deckId}::${cardId}`;
  return p.cardStates[key] ?? {
    cardId,
    deckId,
    card: createEmptyCard(),
  };
}

export function saveCardReview(
  deckId: string,
  cardId: string,
  rating: Rating,
  fsrs: FSRS
): RecordLog {
  const p = getProgress();
  const key = `${deckId}::${cardId}`;
  const state = p.cardStates[key] ?? { cardId, deckId, card: createEmptyCard() };

  const now = new Date();
  const record = fsrs.repeat(state.card, now);
  const result = record[rating as 1 | 2 | 3 | 4];

  p.cardStates[key] = {
    cardId,
    deckId,
    card: (result as { card: Card }).card,
    lastReviewed: now.toISOString(),
  };

  p.totalCardsReviewed += 1;

  // Track last studied deck for home screen "current deck"
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_DECK_KEY, deckId);
  }

  const today = now.toISOString().split('T')[0];
  p.activityByDay[today] = (p.activityByDay[today] ?? 0) + 1;

  const last = p.lastStudyDate;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (last === today) {
    // Same day, no streak change
  } else if (last === yesterdayStr) {
    p.streak += 1;
  } else {
    p.streak = 1;
  }
  p.lastStudyDate = today;

  saveProgress(p);
  return record;
}

export function getDueCards(deckId: string, allCardIds: string[]): string[] {
  const p = getProgress();
  const now = new Date();
  return allCardIds.filter(cardId => {
    const key = `${deckId}::${cardId}`;
    const state = p.cardStates[key];
    if (!state) return true;
    const due = new Date(state.card.due);
    return due <= now;
  });
}

export function saveExamScore(deckId: string, score: number, total: number): void {
  const p = getProgress();
  p.examScores.push({
    id: `exam-${Date.now()}`,
    deckId,
    score,
    total,
    date: new Date().toISOString(),
  });
  saveProgress(p);
}

export function getUserProgress(): UserProgress {
  return getProgress();
}

export function getMasteredCount(deckId: string): number {
  const p = getProgress();
  return Object.values(p.cardStates).filter(
    s => s.deckId === deckId && s.card.stability > 5
  ).length;
}

export function getDeckProgress(deckId: string, totalCards: number): number {
  const mastered = getMasteredCount(deckId);
  return totalCards > 0 ? Math.round((mastered / totalCards) * 100) : 0;
}

export function getLastStudiedDeckId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_DECK_KEY);
}

export function getWeeklyActivity(): number[] {
  const p = getProgress();
  const days: number[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    days.push(p.activityByDay[key] ?? 0);
  }
  return days;
}
