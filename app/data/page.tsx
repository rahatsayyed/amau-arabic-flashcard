'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  exportAllAsZip,
  exportProgressAsJson,
  importFromJson,
  importFromCsv,
  importFromAnki,
  applyCardStatesToLocalStorage,
  type ImportResult,
} from '@/lib/import-export';
import { getCustomDecks, saveCustomDeck } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';
import { upsertDeck } from '@/lib/supabase/decks';
import type { CustomDeck } from '@/lib/storage';

type ToastKind = 'success' | 'error';

export default function DataManagementPage() {
  const router = useRouter();
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [toast, setToast] = useState<{ msg: string; kind: ToastKind } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const csvRef = useRef<HTMLInputElement>(null);
  const ankiRef = useRef<HTMLInputElement>(null);
  const jsonRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCustomDecks(getCustomDecks());
    createClient().auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
  }, []);

  const showToast = (msg: string, kind: ToastKind = 'success') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };

  const saveDeck = async (deck: CustomDeck) => {
    if (isLoggedIn) {
      await upsertDeck(deck);
    } else {
      saveCustomDeck(deck);
    }
    setCustomDecks(getCustomDecks());
  };

  const handleJsonImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoading('json');
    try {
      const result: ImportResult = await importFromJson(file);
      await saveDeck(result.deck);
      if (result.cardStates) applyCardStatesToLocalStorage(result.cardStates as Record<string, unknown>);
      showToast(`"${result.deck.title}" imported (${result.deck.cards.length} cards)`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoading('csv');
    try {
      const deck = await importFromCsv(file);
      await saveDeck(deck);
      showToast(`"${deck.title}" imported (${deck.cards.length} cards)`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleAnkiImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setLoading('anki');
    try {
      const result = await importFromAnki(file);
      for (const deck of result.decks) {
        await saveDeck(deck);
      }
      applyCardStatesToLocalStorage(result.cardStates);
      const totalCards = result.decks.reduce((s, d) => s + d.cards.length, 0);
      showToast(`${result.decks.length} deck(s) imported (${totalCards} cards)`);
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleExportAll = async () => {
    setLoading('export-all');
    try {
      await exportAllAsZip(customDecks);
      showToast('Archive downloaded');
    } catch (err) {
      showToast((err as Error).message, 'error');
    } finally {
      setLoading(null);
    }
  };

  const handleExportProgress = () => {
    exportProgressAsJson();
    showToast('Progress backup downloaded');
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center gap-3 px-gutter h-16 bg-surface shadow-sm">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </button>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Data Management</h1>
      </header>

      <div className="px-container-margin pb-md">

        {/* Hero */}
        <div className="bg-primary-container rounded-2xl p-lg mb-md mt-base overflow-hidden relative">
          <div className="absolute inset-0 opacity-5 select-none pointer-events-none flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary" style={{ fontSize: 180, fontVariationSettings: "'FILL' 1" }}>sync</span>
          </div>
          <p className="font-label-md text-label-md text-on-primary/60 uppercase tracking-widest mb-1">Infrastructure</p>
          <h2 className="font-headline-lg text-headline-lg text-on-primary mb-sm leading-tight">Synchronize Your Legacy</h2>
          <p className="font-body-md text-label-md text-on-primary/70 leading-relaxed">
            Safety check. Importing data will merge with your current collection. Your existing flashcards and progress records will be preserved.
          </p>
        </div>

        {/* ── Import Library ─────────────────────────────────────────────── */}
        <SectionHeader icon="upload_file" label="Import Library" />

        <div className="space-y-sm mb-md">
          {/* JSON import */}
          <ImportCard
            icon="data_object"
            title="Import from Backup"
            subtitle="Restore a deck or full backup exported from this app (.amau.json)"
            loading={loading === 'json'}
            onImport={() => jsonRef.current?.click()}
            accept=".json"
          />
          <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={handleJsonImport} />

          {/* CSV import */}
          <ImportCard
            icon="table_chart"
            title="Import from Spreadsheet"
            subtitle="CSV or TSV file with Arabic and English columns. Column order is auto-detected."
            loading={loading === 'csv'}
            onImport={() => csvRef.current?.click()}
            accept=".csv,.tsv"
          />
          <input ref={csvRef} type="file" accept=".csv,.tsv" className="hidden" onChange={handleCsvImport} />

          {/* Anki import */}
          <ImportCard
            icon="style"
            title="Import from Anki"
            subtitle="Designed for .apkg files. Deck hierarchy, card content, and learning progress are all imported."
            loading={loading === 'anki'}
            onImport={() => ankiRef.current?.click()}
            accept=".apkg"
            badge="Anki"
          />
          <input ref={ankiRef} type="file" accept=".apkg" className="hidden" onChange={handleAnkiImport} />
        </div>

        {/* ── Export Library ─────────────────────────────────────────────── */}
        <SectionHeader icon="download" label="Export Library" />

        <div className="space-y-sm mb-md">
          {/* Complete archive */}
          <div className="bg-surface rounded-xl border border-primary/5 p-md" style={{ boxShadow: '0 4px 12px rgba(23,54,59,0.04)' }}>
            <div className="flex items-start gap-3 mb-md">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-[20px]">archive</span>
              </div>
              <div>
                <p className="font-title-md text-title-md text-on-surface mb-0.5">Complete Archive</p>
                <p className="font-label-md text-[12px] text-on-surface-variant leading-relaxed">
                  Download all your custom decks, progress records, and card overrides as a single ZIP archive.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportAll}
              disabled={loading === 'export-all'}
              className="w-full h-11 bg-primary-container/20 text-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container/30 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading === 'export-all'
                ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                : <span className="material-symbols-outlined text-[18px]">download</span>
              }
              Download Archive
            </button>
          </div>

          {/* Progress backup */}
          <div className="bg-surface rounded-xl border border-primary/5 p-md" style={{ boxShadow: '0 4px 12px rgba(23,54,59,0.04)' }}>
            <div className="flex items-start gap-3 mb-md">
              <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-primary text-[20px]">database</span>
              </div>
              <div>
                <p className="font-title-md text-title-md text-on-surface mb-0.5">Database Backup</p>
                <p className="font-label-md text-[12px] text-on-surface-variant leading-relaxed">
                  A lightweight backup of your entire learning progress — streaks, card states, and study statistics.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportProgress}
              className="w-full h-11 bg-primary-container/20 text-primary rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container/30 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              Download Progress
            </button>
          </div>

          {/* Storage indicator */}
          <div className="bg-surface-container-low rounded-xl p-md flex items-center gap-3 border border-primary/5">
            <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_done</span>
            <div className="flex-1 min-w-0">
              <p className="font-label-md text-label-md text-on-surface">
                {customDecks.length} custom deck{customDecks.length !== 1 ? 's' : ''} · {customDecks.reduce((s, d) => s + d.cards.length, 0)} cards
              </p>
              <p className="font-label-md text-[11px] text-on-surface-variant">Stored locally{isLoggedIn ? ' & synced to cloud' : ''}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-xl shadow-lg font-label-md text-label-md text-white flex items-center gap-2 max-w-[340px] ${toast.kind === 'error' ? 'bg-error' : 'bg-primary'}`}>
          <span className="material-symbols-outlined text-[18px]">{toast.kind === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}
    </>
  );
}

function SectionHeader({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-sm">
      <span className="material-symbols-outlined text-primary text-[20px]">{icon}</span>
      <h2 className="font-title-md text-title-md text-primary">{label}</h2>
    </div>
  );
}

function ImportCard({
  icon,
  title,
  subtitle,
  loading,
  onImport,
  accept,
  badge,
}: {
  icon: string;
  title: string;
  subtitle: string;
  loading: boolean;
  onImport: () => void;
  accept: string;
  badge?: string;
}) {
  return (
    <div className="bg-surface rounded-xl border border-primary/5 p-md" style={{ boxShadow: '0 4px 12px rgba(23,54,59,0.04)' }}>
      <div className="flex items-start gap-3 mb-md">
        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-secondary text-[20px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-title-md text-title-md text-on-surface">{title}</p>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary/10 text-secondary uppercase">{badge}</span>
            )}
          </div>
          <p className="font-label-md text-[12px] text-on-surface-variant leading-relaxed">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onImport}
        disabled={loading}
        className="w-full h-11 bg-secondary text-on-secondary rounded-xl font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-secondary/90 active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {loading
          ? <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          : <span className="material-symbols-outlined text-[18px]">upload</span>
        }
        {loading ? 'Importing…' : `Import ${accept.split(',')[0].replace('.', '').toUpperCase()}`}
      </button>
    </div>
  );
}
