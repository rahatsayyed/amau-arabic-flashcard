'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDeckById } from '@/data/vocabulary';
import { getCustomDeckById, saveCustomDeck, CustomDeck } from '@/lib/storage';

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
  const [loaded, setLoaded] = useState(false);

  // Add card inline
  const [showAddCard, setShowAddCard] = useState(false);
  const [newArabic, setNewArabic] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

  useEffect(() => {
    if (builtinDeck) {
      setName(builtinDeck.title);
      setDescription(builtinDeck.description ?? '');
      setSelectedIcon(builtinDeck.icon ?? 'book_2');
      setCards(builtinDeck.cards.slice(0, 80).map(c => ({ id: c.id, arabic: c.arabic, meaning: c.meaning })));
      setLoaded(true);
    } else {
      const cd = getCustomDeckById(id);
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
  }, [id, builtinDeck]);

  const removeCard = (cardId: string) => setCards(prev => prev.filter(c => c.id !== cardId));

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

  const handleSave = () => {
    if (!name.trim() || !isCustom || !customDeck) {
      router.back();
      return;
    }
    const updated: CustomDeck = {
      ...customDeck,
      title: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
      isPublic,
      cards: cards.map(c => ({ ...c, type: 'vocab' as const })),
      updatedAt: new Date().toISOString(),
    };
    saveCustomDeck(updated);
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
  const totalCards = isCustom ? cards.length : (displayedDeck?.cards.length ?? 0);

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
          <div className="flex items-center justify-between">
            <h2 className="font-title-md text-title-md text-primary">
              Cards ({totalCards})
            </h2>
            {isCustom && (
              <button
                onClick={() => setShowAddCard(true)}
                className="font-label-md text-label-md text-secondary flex items-center gap-1 hover:underline active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add Card
              </button>
            )}
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

            {/* Card list */}
            {cards.map(card => (
              <div
                key={card.id}
                className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 flex items-center gap-3 hover:border-outline transition-colors"
              >
                <div className="w-10 h-10 bg-primary-container/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">translate</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-arabic-body text-arabic-body text-primary truncate" dir="rtl">{card.arabic}</p>
                  <p className="font-label-md text-[12px] text-on-surface-variant truncate">{card.meaning}</p>
                </div>
                {isCustom && (
                  <button
                    onClick={() => removeCard(card.id)}
                    className="p-2 text-outline hover:text-error transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                )}
              </div>
            ))}

            {/* Show truncation notice for built-in decks with many cards */}
            {!isCustom && (displayedDeck?.cards.length ?? 0) > 80 && (
              <p className="text-center font-label-md text-[12px] text-on-surface-variant py-2">
                + {(displayedDeck?.cards.length ?? 0) - 80} more cards (read-only)
              </p>
            )}

            {/* Empty state */}
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
          disabled={!name.trim() && isCustom}
          className="w-full bg-secondary text-on-secondary font-bold py-4 rounded-xl shadow-lg hover:bg-secondary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
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
    </>
  );
}
