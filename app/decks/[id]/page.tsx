"use client";

import { use, useEffect, useRef, useState } from "react";
import { SortBar, type SortMode } from "@/components/SortBar";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDeckById } from "@/data/vocabulary";
import {
  getCardState,
  getDeckProgress,
  getDailyGoal,
  saveDailyGoal,
  getCustomDeckById,
  deleteCustomDeck,
  saveCustomDeck,
  getAllCardOverrides,
  saveCardOverride,
  CustomDeck,
  CustomCard,
} from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import {
  fetchMyDecks,
  deleteDeck as deleteDeckFromSupabase,
  upsertDeck,
} from "@/lib/supabase/decks";

// ── FSRS status ──────────────────────────────────────────────────────────────

type Status = "new" | "learning" | "reviewing" | "mastered";

function getCardStatus(state: number, stability: number): Status {
  if (state === 0) return "new";
  if (state === 1 || state === 3) return "learning";
  if (stability < 10) return "reviewing";
  return "mastered";
}

function getDueLabel(due: string | Date, state: number): string {
  if (state === 0) return "";
  const ms = new Date(due).getTime() - Date.now();
  if (ms <= 0) return "due now";
  const hours = ms / (1000 * 60 * 60);
  if (hours < 24) return `in ${Math.round(hours)}h`;
  const days = Math.ceil(hours / 24);
  return days === 1 ? "tomorrow" : `in ${days}d`;
}

function StatusIndicator({ status, dueLabel }: { status: Status; dueLabel: string }) {
  const statusConfig = {
    new:       { label: "New",       color: "text-secondary-container" },
    learning:  { label: "Learning",  color: "text-primary/60" },
    reviewing: { label: "Reviewing", color: "text-on-tertiary-container" },
    mastered:  { label: "Mastered",  color: "text-secondary-container" },
  }[status];

  return (
    <div className="flex flex-col items-end gap-0.5 mt-0.5">
      <span className={`font-label-md text-[11px] leading-tight ${statusConfig.color}`}>
        {statusConfig.label}
      </span>
      {dueLabel && (
        <span className="font-label-md text-[10px] leading-tight text-on-surface-variant/60">
          {dueLabel}
        </span>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // Resolve deck (built-in or custom)
  const builtinDeck = getDeckById(id);
  const [customDeck, setCustomDeck] = useState<CustomDeck | null>(null);
  const isCustom = !builtinDeck;

  const deck = builtinDeck ?? customDeck;

  // Stats
  const [progress, setProgress] = useState(0);
  const [cardStatuses, setCardStatuses] = useState<Record<string, Status>>({});
  const [cardDueLabels, setCardDueLabels] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<
    Record<string, { arabic: string; meaning: string }>
  >({});
  const [dailyGoal, setDailyGoalState] = useState(20);

  // UI state
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editCard, setEditCard] = useState<{
    id: string;
    arabic: string;
    meaning: string;
  } | null>(null);
  const [editArabic, setEditArabic] = useState("");
  const [editMeaning, setEditMeaning] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Sort state
  const [sortBy, setSortBy] = useState<SortMode>('frequency');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadCustomDeck() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const decks = await fetchMyDecks();
        const found = decks.find((d) => d.id === id);
        if (found) {
          setCustomDeck(found);
          return;
        }
      }
      const cd = getCustomDeckById(id);
      if (cd) setCustomDeck(cd);
    }
    loadCustomDeck();
  }, [id]);

  useEffect(() => {
    if (!deck) return;
    setProgress(getDeckProgress(id, deck.cards.length));
    setDailyGoalState(getDailyGoal());
    setOverrides(getAllCardOverrides(id));

    const statuses: Record<string, Status> = {};
    const dueLabels: Record<string, string> = {};
    for (const card of deck.cards) {
      const state = getCardState(id, card.id);
      statuses[card.id] = getCardStatus(state.card.state as number, state.card.stability);
      dueLabels[card.id] = getDueLabel(state.card.due, state.card.state as number);
    }
    setCardStatuses(statuses);
    setCardDueLabels(dueLabels);
  }, [id, deck]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const maxGoal = deck?.cards.length ?? 50;

  const adjustGoal = (delta: number) => {
    const next = Math.max(5, Math.min(maxGoal, dailyGoal + delta));
    setDailyGoalState(next);
    saveDailyGoal(next);
  };

  const handleDelete = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await deleteDeckFromSupabase(id);
    } else {
      deleteCustomDeck(id);
    }
    router.replace("/decks");
  };

  const openEditCard = (card: {
    id: string;
    arabic: string;
    meaning: string;
  }) => {
    const ov = overrides[card.id];
    setEditArabic(ov?.arabic ?? card.arabic);
    setEditMeaning(ov?.meaning ?? card.meaning);
    setEditCard(card);
  };

  const saveEdit = async () => {
    if (!editCard) return;
    if (isCustom && customDeck) {
      const updated: CustomDeck = {
        ...customDeck,
        cards: customDeck.cards.map((c) =>
          c.id === editCard.id
            ? { ...c, arabic: editArabic, meaning: editMeaning }
            : c,
        ),
        updatedAt: new Date().toISOString(),
      };
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await upsertDeck(updated);
      } else {
        saveCustomDeck(updated);
      }
      setCustomDeck(updated);
    } else {
      saveCardOverride(id, editCard.id, {
        arabic: editArabic,
        meaning: editMeaning,
      });
      setOverrides((prev) => ({
        ...prev,
        [editCard.id]: { arabic: editArabic, meaning: editMeaning },
      }));
    }
    setEditCard(null);
  };

  if (!deck) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Deck not found.</p>
      </div>
    );
  }

  const vocabCards = deck.cards.filter((c) => c.type === "vocab");
  const sentenceCards = deck.cards.filter((c) => c.type === "sentence");

  const STATUS_ORDER: Record<string, number> = { new: 0, learning: 1, reviewing: 2, mastered: 3 };
  const sortedCards = (() => {
    const cards = deck.cards;
    let sorted: typeof cards;
    if (sortBy === 'alpha') {
      sorted = [...cards].sort((a, b) => {
        const aAr = overrides[a.id]?.arabic ?? a.arabic;
        const bAr = overrides[b.id]?.arabic ?? b.arabic;
        return aAr.localeCompare(bAr, 'ar');
      });
    } else if (sortBy === 'mastery') {
      sorted = [...cards].sort((a, b) => {
        const aOrd = STATUS_ORDER[cardStatuses[a.id] ?? 'new'];
        const bOrd = STATUS_ORDER[cardStatuses[b.id] ?? 'new'];
        return aOrd - bOrd;
      });
    } else {
      sorted = [...cards];
    }
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  })();

  return (
    <>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <div className="flex items-center justify-start">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-primary">
              arrow_back
            </span>
          </button>
          <h1 className="font-headline-lg-mobile text-title-md text-primary truncate mx-2">
            {deck.title}
          </h1>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-primary">
              more_vert
            </span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-primary/10 rounded-xl shadow-lg overflow-hidden z-50">
              <Link
                href={`/decks/${id}/edit`}
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-container-low transition-colors text-left"
              >
                <span className="material-symbols-outlined text-on-surface-variant">
                  edit
                </span>
                <span className="font-label-md text-label-md text-on-surface">
                  Edit Deck
                </span>
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setShowDeleteModal(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-error-container/10 transition-colors text-left border-t border-primary/5"
              >
                <span className="material-symbols-outlined text-error">
                  delete
                </span>
                <span className="font-label-md text-label-md text-error">
                  Delete Deck
                </span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="px-container-margin pt-base pb-md">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="mb-lg">
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-md shadow-sm bg-primary-container">
            <span
              className="absolute inset-0 flex items-center justify-center text-on-primary opacity-5 select-none pointer-events-none"
              style={{
                fontSize: "120px",
                lineHeight: 1,
                fontFamily: "Noto Serif",
              }}
              aria-hidden="true"
            >
              {deck.cards[0]?.arabic}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-primary-container/80 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="bg-secondary-container text-on-secondary-fixed px-3 py-1 rounded-full font-label-md text-label-md">
                {progress > 0 ? "In Progress" : "Not Started"}
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

        {/* ── Stats bento ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-sm mb-sm">
          <div className="bg-surface-container-low p-md rounded-xl border border-primary/5">
            <p className="font-label-md text-label-md text-on-surface-variant mb-xs">
              CARDS
            </p>
            <p className="font-title-md text-title-md text-primary">
              {deck.cards.length} Words
            </p>
          </div>
          <div className="bg-surface-container-low p-md rounded-xl border border-primary/5">
            <p className="font-label-md text-label-md text-on-surface-variant mb-xs">
              MASTERY
            </p>
            <div className="flex items-center gap-2">
              <p className="font-title-md text-title-md text-primary">
                {progress}%
              </p>
              <div className="flex-1 h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-secondary-container"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 bg-surface-container-low p-md rounded-xl border border-primary/5 flex items-center justify-between gap-sm">
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-on-surface-variant mb-xs">
                Practice Cards
              </p>
              <p className="font-label-md text-[11px] text-on-surface-variant/60">
                Cards per session
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => adjustGoal(-5)}
                disabled={dailyGoal <= 5}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined">remove</span>
              </button>
              <input
                type="number"
                value={dailyGoal}
                min={5}
                max={maxGoal}
                onChange={e => {
                  const v = Math.max(5, Math.min(maxGoal, Number(e.target.value) || 5));
                  setDailyGoalState(v);
                  saveDailyGoal(v);
                }}
                className="w-14 text-center font-title-md text-title-md text-primary bg-surface border border-outline-variant rounded-lg h-10 outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                onClick={() => adjustGoal(5)}
                disabled={dailyGoal >= maxGoal}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40"
              >
                <span className="material-symbols-outlined">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Start Studying ───────────────────────────────────────────────── */}
        <div className="mb-lg">
          <Link
            href={`/decks/${id}/study?goal=${dailyGoal}`}
            className="w-full h-14 bg-secondary-container text-on-secondary flex items-center justify-center gap-3 rounded-xl shadow-lg border-b-4 border-secondary hover:scale-[1.02] active:scale-95 transition-all duration-200 font-bold"
          >
            <span className="material-symbols-outlined">play_arrow</span>
            <span className="font-label-md text-label-md uppercase tracking-wider">
              Study {dailyGoal} Cards
            </span>
          </Link>
        </div>

        {/* ── Word list ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-md border-b border-primary/10 pb-2">
          <h3 className="font-title-md text-title-md text-primary flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary-container rounded-full" />
            Word List
          </h3>
          <SortBar
            sortBy={sortBy}
            sortDir={sortDir}
            onSortByChange={mode => { setSortBy(mode); setVisibleCount(20); }}
            onSortDirChange={setSortDir}
          />
        </div>

        <div className="space-y-sm mb-md">
          {sortedCards.slice(0, visibleCount).map(card => {
            const ov = overrides[card.id];
            const arabic = ov?.arabic ?? card.arabic;
            const meaning = ov?.meaning ?? card.meaning;
            const status = cardStatuses[card.id] ?? 'new';
            return (
              <button
                key={card.id}
                onClick={() => openEditCard({ id: card.id, arabic: card.arabic, meaning: card.meaning })}
                className="w-full bg-surface p-md rounded-xl border border-primary/5 flex items-center justify-between hover:bg-surface-container-lowest transition-colors text-left"
                style={{ boxShadow: '0 4px 12px rgba(23,54,59,0.04)' }}
              >
                <div className="flex flex-col min-w-0 flex-1 mr-3">
                  <span className="font-arabic-body text-arabic-body text-primary leading-tight truncate" dir="rtl">
                    {arabic}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 max-w-[48%]">
                  <span className="font-body-lg text-body-lg text-primary block truncate">{meaning}</span>
                  <StatusIndicator status={status} dueLabel={cardDueLabels[card.id] ?? ''} />
                </div>
              </button>
            );
          })}
          <div className="flex items-center justify-center gap-sm pt-1">
            {visibleCount < sortedCards.length && (
              <button
                onClick={() => setVisibleCount(c => Math.min(c + 20, sortedCards.length))}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low hover:border-secondary hover:text-secondary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
                Show {Math.min(20, sortedCards.length - visibleCount)} more
              </button>
            )}
            {visibleCount > 20 && (
              <button
                onClick={() => setVisibleCount(20)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-outline-variant font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-low transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">expand_less</span>
                Show less
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ────────────────────────────────────────── */}
      {/* ── Portals: rendered at document.body to escape phone-shell clip ─────── */}
      {mounted &&
        showDeleteModal &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm">
            <div className="w-[90%] max-w-[360px] bg-surface rounded-xl shadow-2xl overflow-hidden p-6 flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center mb-4">
                  <span
                    className="material-symbols-outlined text-secondary text-[40px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    warning
                  </span>
                </div>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2">
                  Delete Deck?
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Are you sure you want to delete{" "}
                  <span className="font-bold text-on-surface">
                    '{deck.title}'
                  </span>
                  ? This action cannot be undone and all your progress will be
                  lost.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleDelete}
                  className="w-full py-4 bg-secondary text-on-secondary font-bold rounded-lg flex items-center justify-center gap-2 active:translate-y-0.5 transition-all"
                  style={{ boxShadow: "0 2px 0 0 #8f1000" }}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    delete
                  </span>
                  Delete Forever
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full py-4 border-2 border-outline/20 text-on-surface-variant font-bold rounded-lg hover:bg-surface-container-low transition-colors"
                >
                  Keep Deck
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── Edit card bottom drawer ──────────────────────────────────────────── */}
      {mounted &&
        editCard &&
        createPortal(
          <div
            className="fixed inset-0 bg-on-surface/40 z-50 flex items-end justify-center"
            onClick={() => setEditCard(null)}
          >
            <div
              className="w-full max-w-[390px] bg-surface-container-low rounded-t-xl shadow-lg flex flex-col max-h-[50vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex justify-center py-3 cursor-grab"
                onClick={() => setEditCard(null)}
              >
                <div className="w-10 h-1.5 bg-outline-variant rounded-full" />
              </div>
              <div className="px-container-margin pb-md overflow-y-auto">
                <h3 className="font-title-md text-title-md text-primary mb-md">
                  Edit Card
                </h3>
                <div className="space-y-md mb-lg">
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">
                      Arabic Word / Phrase
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={editArabic}
                      onChange={(e) => setEditArabic(e.target.value)}
                      className="w-full h-14 px-4 rounded-xl border border-outline-variant bg-surface focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all font-arabic-body text-arabic-body"
                      placeholder="e.g. مطار"
                    />
                  </div>
                  <div className="space-y-xs">
                    <label className="block font-label-md text-label-md text-on-surface-variant">
                      English Translation
                    </label>
                    <input
                      type="text"
                      value={editMeaning}
                      onChange={(e) => setEditMeaning(e.target.value)}
                      className="w-full h-14 px-4 rounded-xl border border-outline-variant bg-surface focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all font-body-md text-body-md"
                      placeholder="e.g. Airport"
                    />
                  </div>
                </div>
                <div className="flex gap-sm">
                  <button
                    onClick={() => setEditCard(null)}
                    className="flex-1 h-14 rounded-xl font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    className="flex-1 h-14 bg-secondary-container text-on-secondary rounded-xl shadow-lg border-b-4 border-secondary hover:scale-[1.02] active:scale-95 transition-all font-label-md text-label-md uppercase tracking-wider"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
