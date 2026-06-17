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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (builtinDeck) {
      setName(builtinDeck.title);
      setDescription(builtinDeck.description ?? '');
      setSelectedIcon(builtinDeck.icon ?? 'book_2');
      setLoaded(true);
    } else {
      const cd = getCustomDeckById(id);
      if (cd) {
        setCustomDeck(cd);
        setName(cd.title);
        setDescription(cd.description);
        setSelectedIcon(cd.icon);
        setIsPublic(cd.isPublic);
        setLoaded(true);
      }
    }
  }, [id, builtinDeck]);

  const handleSave = () => {
    if (!name.trim()) return;
    if (isCustom && customDeck) {
      const updated: CustomDeck = {
        ...customDeck,
        title: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        isPublic,
        updatedAt: new Date().toISOString(),
      };
      saveCustomDeck(updated);
    }
    // Built-in decks: title/description edits not persisted (read-only corpus)
    router.back();
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-on-surface-variant">Loading…</p>
      </div>
    );
  }

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
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Edit Deck</h1>
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
              disabled={!isCustom}
              className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all disabled:opacity-60"
            />
          </div>
          <div className="space-y-xs">
            <label className="font-label-md text-label-md text-on-surface-variant block ml-1" htmlFor="deck-desc">
              Description
            </label>
            <textarea
              id="deck-desc"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={!isCustom}
              className="w-full px-4 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-lg font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all resize-none disabled:opacity-60"
            />
          </div>
          {!isCustom && (
            <p className="text-xs text-outline italic px-1">
              Built-in deck names cannot be edited.
            </p>
          )}
        </section>

        {/* Icon picker */}
        <section className="space-y-sm">
          <h3 className="font-label-md text-label-md text-on-surface-variant ml-1">Choose Icon</h3>
          <div className="grid grid-cols-5 gap-sm">
            {ICONS.map(icon => (
              <button
                key={icon}
                onClick={() => isCustom && setSelectedIcon(icon)}
                className={`aspect-square flex items-center justify-center rounded-lg border-2 transition-all ${
                  selectedIcon === icon
                    ? 'bg-primary text-on-primary border-secondary scale-105 shadow-md'
                    : 'bg-surface-container-lowest text-primary-container border-outline-variant hover:border-secondary'
                } ${!isCustom ? 'cursor-default' : ''}`}
              >
                <span className="material-symbols-outlined">{icon}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Privacy (custom decks only) */}
        {isCustom && (
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
          </section>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] p-gutter bg-surface/90 backdrop-blur-md z-50">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full bg-secondary text-on-secondary font-bold py-4 rounded-xl shadow-lg shadow-secondary/20 hover:bg-secondary/90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
        >
          <span className="material-symbols-outlined">save</span>
          Save Changes
        </button>
      </div>
    </>
  );
}
