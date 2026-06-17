'use client';

import { use, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { getDeckById } from '@/data/vocabulary';
import { getCustomDeckById, saveCustomDeck, saveCardOverride, getAllCardOverrides, CustomDeck } from '@/lib/storage';
import { createClient } from '@/lib/supabase/client';
import { fetchMyDecks, upsertDeck } from '@/lib/supabase/decks';
import { SortBar, type SortMode } from '@/components/SortBar';

const ICONS = ['book_2', 'auto_stories', 'translate', 'forum', 'palette'];

export default function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const builtinDeck = getDeckById(id);
  const [customDeck, setCustomDeck] = useState<CustomDeck | null>(null);
  const isCustom = !builtinDeck;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book_2');
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState<{ id: string; arabic: string; meaning: string }[]>([]);
  const [overrides, setOverrides] = useState<Record<string, { arabic: string; meaning: string }>>({});
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState<SortMode>('frequency');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [visibleCount, setVisibleCount] = useState(20);

  // Add card inline
  const [showAddCard, setShowAddCard] = useState(false);
  const [newArabic, setNewArabic] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

  // Edit card drawer
  const [editCard, setEditCard] = useState<{ id: string; arabic: string; meaning: string } | null>(null);
  const [editArabic, setEditArabic] = useState('');
  const [editMeaning, setEditMeaning] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (builtinDeck) {
      setName(builtinDeck.title);
      setDescription(builtinDeck.description ?? '');
      setSelectedIcon(builtinDeck.icon ?? 'book_2');
      setCards(builtinDeck.cards.slice(0, 80).map(c => ({ id: c.id, arabic: c.arabic, meaning: c.meaning })));
      setOverrides(getAllCardOverrides(id));
      setLoaded(true);
    } else {
      async function loadCustom() {
        // Try Supabase first if logged in
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        let cd: CustomDeck | undefined;
        if (user) {
          const decks = await fetchMyDecks();
          cd = decks.find(d => d.id === id);
        }
        cd = cd ?? getCustomDeckById(id);
        if (cd) {
          setCustomDeck(cd);
          setName(cd.title);
          setDescription(cd.description);
          setSelectedIcon(cd.icon);
          setIsPublic(cd.isPublic);
          setCards(cd.cards.map(c => ({ id: c.id, arabic: c.arabic, meaning: c.meaning })));
          setLoaded(true);
        }
      }
      loadCustom();
    }
  }, [id, builtinDeck]);

  const addCard = () => {
    if (!newArabic.trim() || !newMeaning.trim()) return;
    setCards(prev => [...prev, {
      id: `card-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      arabic: newArabic.trim(),
      meaning: newMeaning.trim(),
    }]);
    setNewArabic('');
    setNewMeaning('');
    setShowAddCard(false);
  };

  const openEditCard = (card: { id: string; arabic: string; meaning: string }) => {
    const ov = overrides[card.id];
    setEditArabic(ov?.arabic ?? card.arabic);
    setEditMeaning(ov?.meaning ?? card.meaning);
    setEditCard(card);
  };

  const saveEdit = () => {
    if (!editCard) return;
    if (isCustom) {
      setCards(prev => prev.map(c =>
        c.id === editCard.id ? { ...c, arabic: editArabic, meaning: editMeaning } : c
      ));
    } else {
      saveCardOverride(id, editCard.id, { arabic: editArabic, meaning: editMeaning });
      setOverrides(prev => ({ ...prev, [editCard.id]: { arabic: editArabic, meaning: editMeaning } }));
      setCards(prev => prev.map(c =>
        c.id === editCard.id ? { ...c, arabic: editArabic, meaning: editMeaning } : c
      ));
    }
    setEditCard(null);
  };

  const removeCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setEditCard(null);
  };

  const handleSave = async () => {
    if (isCustom && customDeck) {
      const updated: CustomDeck = {
        ...customDeck,
        title: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        isPublic,
        cards: cards.map(c => ({ ...c, type: 'vocab' as const })),
        updatedAt: new Date().toISOString(),
      };
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await upsertDeck(updated);
      } else {
        saveCustomDeck(updated);
      }
    }
    router.back();
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Loading…</p>
      </div>
    );
  }

  const displayedDeck = builtinDeck ?? customDeck;

  const sortedCards = (() => {
    let sorted: typeof cards;
    if (sortBy === 'alpha') {
      sorted = [...cards].sort((a, b) => {
        const aAr = overrides[a.id]?.arabic ?? a.arabic;
        const bAr = overrides[b.id]?.arabic ?? b.arabic;
        return aAr.localeCompare(bAr, 'ar');
      });
    } else if (sortBy === 'mastery') {
      sorted = [...cards].sort((a, b) => {
        const aMeaning = overrides[a.id]?.meaning ?? a.meaning;
        const bMeaning = overrides[b.id]?.meaning ?? b.meaning;
        return aMeaning.localeCompare(bMeaning);
      });
    } else {
      sorted = [...cards];
    }
    return sortDir === 'desc' ? sorted.reverse() : sorted;
  })();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low active:opacity-80 transition-opacity"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Edit Deck</h1>
        </div>
      </header>

      <div className="pt-2 pb-32 px-container-margin space-y-lg">

        {/* Name & Description */}
        <section className="space-y-md">
          <div className="space-y-xs">
            <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="deck-name">
              Deck Title
            </label>
            <input
              id="deck-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={!isCustom}
              placeholder="e.g. My First Vocabulary"
              className="w-full bg-surface-container-lowest ring-1 ring-outline-variant focus:ring-2 focus:ring-secondary-container rounded-lg p-4 font-body-md text-body-md text-on-surface transition-all outline-none disabled:opacity-60"
            />
          </div>
          <div className="space-y-xs">
            <label className="block font-label-md text-label-md text-on-surface-variant uppercase tracking-wider" htmlFor="deck-desc">
              Description
            </label>
            <textarea
              id="deck-desc"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!isCustom}
              placeholder="What will users learn?"
              className="w-full bg-surface-container-lowest ring-1 ring-outline-variant focus:ring-2 focus:ring-secondary-container rounded-lg p-4 font-body-md text-body-md text-on-surface transition-all outline-none resize-none disabled:opacity-60"
            />
          </div>
          {!isCustom && (
            <p className="text-xs text-outline italic">Built-in deck names cannot be edited.</p>
          )}
        </section>

        {/* Icon picker (custom only) */}
        {isCustom && (
          <section className="space-y-sm">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Choose Icon</h3>
            <div className="grid grid-cols-5 gap-sm">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`aspect-square flex items-center justify-center rounded-lg border-2 transition-all ${
                    selectedIcon === icon
                      ? 'bg-primary text-on-primary border-secondary scale-105 shadow-md'
                      : 'bg-surface-container-lowest text-primary-container border-outline-variant hover:border-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined">{icon}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Privacy (custom only) */}
        {isCustom && (
          <section className="space-y-sm">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Visibility</h3>
            <div className="bg-surface-container-high p-1 rounded-xl flex gap-1">
              <button
                onClick={() => setIsPublic(true)}
                className={`flex-1 py-3 px-4 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 transition-all ${
                  isPublic ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">public</span>
                Public
              </button>
              <button
                onClick={() => setIsPublic(false)}
                className={`flex-1 py-3 px-4 rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 transition-all ${
                  !isPublic ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">lock</span>
                Private
              </button>
            </div>
          </section>
        )}

        {/* Cards section */}
        <section className="space-y-sm">
          <div className="flex items-center justify-between mb-md border-b border-primary/10 pb-2">
            <h3 className="font-title-md text-title-md text-primary flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary-container rounded-full" />
              Word List
            </h3>
            <div className="flex items-center gap-sm">
              <SortBar
                sortBy={sortBy}
                sortDir={sortDir}
                onSortByChange={mode => { setSortBy(mode); setVisibleCount(20); }}
                onSortDirChange={setSortDir}
              />
              {isCustom && (
                <button
                  onClick={() => setShowAddCard(true)}
                  className="font-label-md text-label-md text-secondary flex items-center gap-1 active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-sm">
            {/* Inline add card form */}
            {showAddCard && (
              <div className="bg-surface-container-lowest p-sm rounded-xl border border-secondary-container space-y-sm">
                <input
                  type="text"
                  dir="rtl"
                  value={newArabic}
                  onChange={e => setNewArabic(e.target.value)}
                  placeholder="e.g. مطار"
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all font-arabic-body text-arabic-body"
                  autoFocus
                />
                <input
                  type="text"
                  value={newMeaning}
                  onChange={e => setNewMeaning(e.target.value)}
                  placeholder="e.g. Airport"
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant bg-surface focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all font-body-md text-body-md"
                  onKeyDown={e => e.key === 'Enter' && addCard()}
                />
                <div className="flex gap-sm">
                  <button
                    onClick={() => { setShowAddCard(false); setNewArabic(''); setNewMeaning(''); }}
                    className="flex-1 h-10 rounded-lg font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addCard}
                    className="flex-1 h-10 bg-secondary-container text-on-secondary rounded-lg font-label-md text-label-md uppercase tracking-wider active:scale-95 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Card list — same tile as deck details, no FSRS indicator */}
            {sortedCards.slice(0, visibleCount).map(card => {
              const ov = overrides[card.id];
              const arabic = ov?.arabic ?? card.arabic;
              const meaning = ov?.meaning ?? card.meaning;
              return (
                <button
                  key={card.id}
                  onClick={() => openEditCard(card)}
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

            {isCustom && cards.length === 0 && !showAddCard && (
              <button
                onClick={() => setShowAddCard(true)}
                className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 hover:border-secondary hover:text-secondary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">add</span>
                Add First Card
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Bottom CTAs */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-gutter bg-surface/90 backdrop-blur-md z-50 flex flex-col gap-sm">
        <button
          onClick={handleSave}
          className="w-full bg-secondary text-on-secondary font-bold py-4 rounded-xl shadow-lg hover:bg-secondary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">save</span>
          Save Changes
        </button>
        <button
          onClick={() => router.back()}
          className="w-full bg-transparent text-on-surface-variant font-label-md text-label-md py-3 rounded-xl hover:bg-surface-container-high transition-colors"
        >
          Discard Changes
        </button>
      </div>

      {/* Edit card bottom drawer — portal to escape phone shell */}
      {mounted && editCard && createPortal(
        <div className="fixed inset-0 bg-on-surface/40 z-50 flex items-end justify-center" onClick={() => setEditCard(null)}>
          <div className="w-full max-w-[390px] bg-surface-container-low rounded-t-xl shadow-lg flex flex-col max-h-[60vh]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-center py-3 cursor-grab" onClick={() => setEditCard(null)}>
              <div className="w-10 h-1.5 bg-outline-variant rounded-full" />
            </div>
            <div className="px-container-margin pb-md overflow-y-auto">
              <h3 className="font-title-md text-title-md text-primary mb-md">Edit Card</h3>
              <div className="space-y-md mb-lg">
                <div className="space-y-xs">
                  <label className="block font-label-md text-label-md text-on-surface-variant">
                    Arabic Word / Phrase
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={editArabic}
                    onChange={e => setEditArabic(e.target.value)}
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
                    onChange={e => setEditMeaning(e.target.value)}
                    className="w-full h-14 px-4 rounded-xl border border-outline-variant bg-surface focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all font-body-md text-body-md"
                    placeholder="e.g. Airport"
                  />
                </div>
              </div>
              <div className="flex gap-sm mb-sm">
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
              {isCustom && editCard && (
                <button
                  onClick={() => removeCard(editCard.id)}
                  className="w-full h-10 flex items-center justify-center gap-2 text-error font-label-md text-label-md hover:bg-error-container/10 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Remove Card
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
