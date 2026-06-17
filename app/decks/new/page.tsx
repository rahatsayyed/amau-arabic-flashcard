'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveCustomDeck, CustomDeck, CustomCard } from '@/lib/storage';

const ICONS = ['book_2', 'auto_stories', 'translate', 'forum', 'palette'];

export default function CreateDeckPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('book_2');
  const [isPublic, setIsPublic] = useState(true);
  const [cards, setCards] = useState<{ id: string; arabic: string; meaning: string }[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newArabic, setNewArabic] = useState('');
  const [newMeaning, setNewMeaning] = useState('');

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

  const removeCard = (id: string) => setCards(prev => prev.filter(c => c.id !== id));

  const handleCreate = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString();
    const deck: CustomDeck = {
      id: `custom-${Date.now()}`,
      title: name.trim(),
      description: description.trim(),
      icon: selectedIcon,
      isPublic,
      cards: cards.map(c => ({ ...c, type: 'vocab' as const })),
      createdAt: now,
      updatedAt: now,
    };
    saveCustomDeck(deck);
    router.replace(`/decks/${deck.id}`);
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors active:opacity-80"
          >
            <span className="material-symbols-outlined text-primary">close</span>
          </button>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Create Deck</h1>
        </div>
      </header>

      <div className="pt-2 pb-32 px-container-margin space-y-lg">
        {/* Name */}
        <section className="space-y-sm">
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="deck-name">
              Deck Name
            </label>
            <input
              id="deck-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Levantine Verb Conjugation"
              className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
            />
          </div>
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="deck-desc">
              Description (Optional)
            </label>
            <textarea
              id="deck-desc"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the focus of this deck..."
              className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all resize-none"
            />
          </div>
        </section>

        {/* Icon picker */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant ml-1">Choose Icon</h3>
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

        {/* Privacy */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant ml-1">Privacy Settings</h3>
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
          <p className="text-xs text-outline italic px-1">
            {isPublic
              ? 'Public decks can be discovered and used by the Learn Arabic community.'
              : 'Only you will be able to see and study this deck.'}
          </p>
        </section>

        {/* Add Cards */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant ml-1">Add Cards</h3>
          <div className="space-y-sm">
            {cards.map(card => (
              <div
                key={card.id}
                className="flex items-center justify-between p-sm bg-surface-container-low border border-outline-variant rounded-xl"
              >
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="font-arabic-body text-arabic-body text-primary truncate" dir="rtl">{card.arabic}</p>
                  <p className="font-label-md text-[12px] text-on-surface-variant truncate">{card.meaning}</p>
                </div>
                <button
                  onClick={() => removeCard(card.id)}
                  className="ml-sm p-1.5 rounded-full hover:bg-error-container/20 text-error transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}

            {/* Add card inline form */}
            {showAddCard ? (
              <div className="p-sm bg-surface-container-low border border-secondary-container rounded-xl space-y-sm">
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
            ) : (
              <button
                onClick={() => setShowAddCard(true)}
                className="w-full py-4 border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-label-md text-label-md flex items-center justify-center gap-2 hover:border-secondary hover:text-secondary transition-all active:scale-95"
              >
                <span className="material-symbols-outlined">add</span>
                {cards.length === 0 ? 'Add First Card' : 'Add Another Card'}
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-gutter bg-surface/90 backdrop-blur-md z-50">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full bg-secondary text-on-secondary font-bold py-4 rounded-xl shadow-lg shadow-secondary/20 hover:bg-secondary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Create Deck
        </button>
      </div>
    </>
  );
}
