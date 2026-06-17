'use client';

import type { CustomDeck, CustomCard, UserProgress } from './storage';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isArabic(str: string): boolean {
  return /[؀-ۿ]/.test(str);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(title: string): string {
  return title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

// ── Export ────────────────────────────────────────────────────────────────────

type ExportableDeck = { id: string; title: string; cards: unknown[] };

export function exportDeckAsJson(deck: ExportableDeck, includeProgress = true): void {
  const cardStates: Record<string, unknown> = {};
  if (includeProgress) {
    try {
      const raw = localStorage.getItem('amau_progress');
      if (raw) {
        const progress = JSON.parse(raw) as UserProgress;
        for (const [key, state] of Object.entries(progress.cardStates)) {
          if (key.startsWith(deck.id + '::')) cardStates[key] = state;
        }
      }
    } catch {}
  }
  const payload = { version: 1, deck, cardStates: includeProgress ? cardStates : undefined };
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `${safeName(deck.title)}.amau.json`,
  );
}

export async function exportAllAsZip(decks: CustomDeck[]): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  zip.file('decks.json', JSON.stringify(decks, null, 2));

  try {
    const raw = localStorage.getItem('amau_progress');
    zip.file('progress.json', raw ?? '{}');
  } catch {
    zip.file('progress.json', '{}');
  }

  try {
    const raw = localStorage.getItem('amau_card_overrides');
    zip.file('overrides.json', raw ?? '{}');
  } catch {
    zip.file('overrides.json', '{}');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, 'arabic_flashcards_backup.zip');
}

export function exportProgressAsJson(): void {
  try {
    const raw = localStorage.getItem('amau_progress') ?? '{}';
    triggerDownload(
      new Blob([raw], { type: 'application/json' }),
      'arabic_progress_backup.json',
    );
  } catch {}
}

// ── Import — JSON ─────────────────────────────────────────────────────────────

export interface ImportResult {
  deck: CustomDeck;
  cardStates?: Record<string, unknown>;
}

export async function importFromJson(file: File): Promise<ImportResult> {
  const text = await file.text();
  const payload = JSON.parse(text);

  if (payload.version === 1 && payload.deck) {
    return { deck: payload.deck as CustomDeck, cardStates: payload.cardStates };
  }
  // Bare deck object
  if (payload.id && payload.cards) {
    return { deck: payload as CustomDeck };
  }
  throw new Error('Unrecognised JSON format');
}

// ── Import — CSV ──────────────────────────────────────────────────────────────

export async function importFromCsv(file: File): Promise<CustomDeck> {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter(l => l.trim());

  const deckTitle = file.name.replace(/\.(csv|tsv)$/i, '').replace(/_/g, ' ');
  const cards: CustomCard[] = [];
  const now = new Date().toISOString();

  for (const line of lines) {
    const sep = line.includes('\t') ? '\t' : ',';
    const parts = line.split(sep).map(s => s.replace(/^"|"$/g, '').trim());
    if (parts.length < 2) continue;

    // Auto-detect Arabic column
    let arabic = parts[0];
    let meaning = parts[1];
    if (!isArabic(arabic) && isArabic(meaning)) {
      [arabic, meaning] = [meaning, arabic];
    }
    if (!arabic || !meaning) continue;

    cards.push({
      id: `card-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      arabic,
      meaning,
      type: 'vocab',
    });
  }

  if (cards.length === 0) throw new Error('No valid card rows found in CSV');

  return {
    id: `custom-${Date.now()}`,
    title: deckTitle,
    description: `Imported from ${file.name}`,
    icon: 'book_2',
    isPublic: false,
    cards,
    createdAt: now,
    updatedAt: now,
  };
}

// ── Import — Anki (delegates to server API route) ────────────────────────────

export interface AnkiImportResult {
  decks: CustomDeck[];
  cardStates: Record<string, unknown>;
}

export async function importFromAnki(file: File): Promise<AnkiImportResult> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/import/anki', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Server error' }));
    throw new Error(err.error ?? 'Anki import failed');
  }
  return res.json() as Promise<AnkiImportResult>;
}

// ── Apply imported progress to localStorage ───────────────────────────────────

export function applyCardStatesToLocalStorage(cardStates: Record<string, unknown>): void {
  try {
    const raw = localStorage.getItem('amau_progress');
    const progress: UserProgress = raw
      ? JSON.parse(raw)
      : { streak: 0, lastStudyDate: '', totalCardsReviewed: 0, cardStates: {}, examScores: [], activityByDay: {} };
    Object.assign(progress.cardStates, cardStates);
    localStorage.setItem('amau_progress', JSON.stringify(progress));
  } catch {}
}
