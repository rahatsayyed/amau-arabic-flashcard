import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { readFileSync } from 'fs';
import path from 'path';

// Anki epoch: Jan 1, 2006 (days offset used in due dates for review cards)
const ANKI_EPOCH_MS = new Date('2006-01-01T00:00:00Z').getTime();

function isArabicStr(s: string): boolean {
  return /[؀-ۿ]/.test(s);
}

function safeDeckId(name: string): string {
  return 'anki-' + name.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 32) + '-' + Date.now();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find the SQLite database (prefer .anki21 over .anki2)
    const dbEntry = zip.file('collection.anki21') ?? zip.file('collection.anki2');
    if (!dbEntry) {
      return NextResponse.json({ error: 'No Anki collection database found in .apkg' }, { status: 400 });
    }

    const dbBytes = await dbEntry.async('uint8array');

    const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const wasmBuffer = readFileSync(wasmPath);
    const SQL = await initSqlJs({ wasmBinary: wasmBuffer.buffer.slice(wasmBuffer.byteOffset, wasmBuffer.byteOffset + wasmBuffer.byteLength) as ArrayBuffer });
    const db = new SQL.Database(dbBytes);

    // Read deck map from col table
    const colRows = db.exec("SELECT decks FROM col LIMIT 1");
    const decksJson = colRows[0]?.values[0]?.[0] as string;
    const deckMap: Record<string, { id: number; name: string }> = decksJson ? JSON.parse(decksJson) : {};

    // Build did → name mapping
    const didToName: Record<string, string> = {};
    for (const [, deck] of Object.entries(deckMap)) {
      if (typeof deck === 'object' && deck.id && deck.name) {
        didToName[String(deck.id)] = String(deck.name);
      }
    }

    // Read all notes
    const notesRows = db.exec("SELECT id, flds FROM notes");
    const noteMap: Record<string, string[]> = {};
    if (notesRows[0]) {
      for (const row of notesRows[0].values) {
        const nid = String(row[0]);
        const flds = String(row[1]).split('\x1f');
        noteMap[nid] = flds;
      }
    }

    // Read all cards with scheduling info
    const cardsRows = db.exec("SELECT id, nid, did, type, due, ivl, factor FROM cards WHERE queue >= 0");

    // Group cards by deck
    const deckCards: Record<string, Array<{ nid: string; type: number; due: number; ivl: number; factor: number }>> = {};
    if (cardsRows[0]) {
      for (const row of cardsRows[0].values) {
        const [id, nid, did, type, due, ivl, factor] = row.map(Number);
        const didStr = String(did);
        if (!deckCards[didStr]) deckCards[didStr] = [];
        deckCards[didStr].push({ nid: String(nid), type, due, ivl, factor });
      }
    }

    db.close();

    // Build output
    const now = new Date().toISOString();
    const resultDecks = [];
    const cardStates: Record<string, unknown> = {};

    for (const [did, cards] of Object.entries(deckCards)) {
      const deckName = didToName[did] ?? 'Imported Deck';
      // Use the last segment of hierarchical name (e.g. "Arabic::Vocab" → "Vocab")
      const shortName = deckName.split('::').pop() ?? deckName;
      const deckId = safeDeckId(deckName);

      const customCards = [];
      for (const card of cards) {
        const fields = noteMap[card.nid];
        if (!fields || fields.length < 2) continue;

        let arabic = fields[0].trim();
        let meaning = fields[1].trim();

        // Strip HTML tags
        arabic = arabic.replace(/<[^>]*>/g, '').trim();
        meaning = meaning.replace(/<[^>]*>/g, '').trim();

        // Auto-detect column order
        if (!isArabicStr(arabic) && isArabicStr(meaning)) {
          [arabic, meaning] = [meaning, arabic];
        }

        if (!arabic || !meaning) continue;

        const cardId = `card-${card.nid}`;

        customCards.push({
          id: cardId,
          arabic,
          meaning,
          type: 'vocab' as const,
        });

        // Map Anki scheduling → FSRS-compatible
        const stateKey = `${deckId}::${cardId}`;
        let dueDate: string;
        if (card.type === 2 || card.type === 3) {
          // Review/relearning: due is days since Anki epoch
          dueDate = new Date(ANKI_EPOCH_MS + card.due * 86400000).toISOString();
        } else {
          dueDate = now;
        }

        cardStates[stateKey] = {
          cardId,
          deckId,
          card: {
            due: dueDate,
            stability: Math.max(1, card.ivl),
            difficulty: card.factor > 0 ? (5 - (card.factor - 1300) / 1000) : 5,
            elapsed_days: 0,
            scheduled_days: Math.max(1, card.ivl),
            reps: 0,
            lapses: 0,
            state: card.type,
            last_review: dueDate,
          },
          lastReviewed: now,
        };
      }

      if (customCards.length === 0) continue;

      resultDecks.push({
        id: deckId,
        title: shortName,
        description: `Imported from Anki: ${deckName}`,
        icon: 'book_2',
        isPublic: false,
        cards: customCards,
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ decks: resultDecks, cardStates });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
