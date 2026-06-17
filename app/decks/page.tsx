"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DECKS } from "@/data/vocabulary";
import { getDeckProgress, getCustomDecks, CustomDeck } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { fetchMyDecks } from "@/lib/supabase/decks";

const BUILTIN_ICONS: Record<string, string> = {
  "names-of-allah": "auto_awesome",
  "section-4": "auto_stories",
  "section-5": "edit",
  "section-6": "palette",
  "section-7": "restaurant",
  "section-8": "flight_takeoff",
};

export default function DecksPage() {
  const [deckProgress, setDeckProgress] = useState<Record<string, number>>({});
  const [customDecks, setCustomDecks] = useState<CustomDeck[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);

      let cd: CustomDeck[];
      if (user) {
        cd = await fetchMyDecks();
      } else {
        cd = getCustomDecks();
      }
      setCustomDecks(cd);

      const dp: Record<string, number> = {};
      for (const deck of DECKS) {
        dp[deck.id] = getDeckProgress(deck.id, deck.cards.length);
      }
      for (const deck of cd) {
        dp[deck.id] = getDeckProgress(deck.id, deck.cards.length);
      }
      setDeckProgress(dp);
    }

    load();
  }, []);

  const totalDecks = DECKS.length + customDecks.length;

  return (
    <>
      <header className="flex items-center justify-between px-gutter h-16 bg-primary-container text-on-primary">
        <span className="font-headline-lg-mobile text-headline-lg-mobile">
          Decks
        </span>
      </header>

      {/* Hero */}
      <div className="bg-primary-container pt-4 pb-16 px-container-margin flex flex-col items-center text-center rounded-b-[40px] shadow-lg">
        <div className="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center shadow-md mb-sm">
          <span
            className="material-symbols-outlined text-primary text-[40px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            style
          </span>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-primary mb-xs">
          Your Library
        </h1>
        <p className="font-label-md text-label-md text-on-primary-container opacity-80 uppercase tracking-widest">
          {isLoggedIn
            ? "Synced with your account"
            : "Master your Arabic collection"}
        </p>
      </div>

      <div className="px-container-margin pb-md">
        {/* Floating action buttons */}
        <div className="-mt-8 mb-md grid grid-cols-2 gap-gutter relative z-10">
          <button className="pressable-btn flex items-center justify-center gap-2 bg-surface text-primary border border-primary/10 py-3 px-4 rounded-xl font-label-md text-label-md tonal-elevation text-sm">
            <span className="material-symbols-outlined text-[20px]">
              explore
            </span>
            Public Decks
          </button>
          <Link
            href="/decks/new"
            className="pressable-btn flex items-center justify-center gap-2 bg-secondary text-on-secondary py-3 px-4 rounded-xl font-label-md text-label-md shadow-md text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create New
          </Link>
        </div>

        {/* Decks grid */}
        <div className="mt-lg">
          <div className="flex items-center justify-between mb-sm">
            <h3 className="font-title-md text-title-md text-primary">
              Your Decks
            </h3>
            <span className="font-label-md text-label-md text-on-surface-variant">
              {totalDecks} decks
            </span>
          </div>
          <div className="grid grid-cols-2 gap-gutter">
            {DECKS.map((deck) => {
              const pct = deckProgress[deck.id] ?? 0;
              return (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="bg-white rounded-xl p-sm border border-primary/10 tonal-elevation flex flex-col justify-between min-h-[160px] active:scale-[0.98] transition-transform"
                >
                  <div>
                    <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center mb-sm">
                      <span className="material-symbols-outlined text-primary">
                        {BUILTIN_ICONS[deck.id] ?? "style"}
                      </span>
                    </div>
                    <h4 className="font-title-md text-[16px] leading-tight text-primary line-clamp-2">
                      {deck.title}
                    </h4>
                    <p className="font-label-md text-[12px] text-on-surface-variant mt-1">
                      {deck.cards.length} Cards
                    </p>
                  </div>
                  <div className="mt-md">
                    <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
            {customDecks.map((deck) => {
              const pct = deckProgress[deck.id] ?? 0;
              return (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="bg-white rounded-xl p-sm border border-primary/10 tonal-elevation flex flex-col justify-between min-h-[160px] active:scale-[0.98] transition-transform"
                >
                  <div>
                    <div className="w-10 h-10 bg-surface-container-high rounded-lg flex items-center justify-center mb-sm">
                      <span className="material-symbols-outlined text-primary">
                        {deck.icon}
                      </span>
                    </div>
                    <h4 className="font-title-md text-[16px] leading-tight text-primary line-clamp-2">
                      {deck.title}
                    </h4>
                    <p className="font-label-md text-[12px] text-on-surface-variant mt-1">
                      {deck.cards.length} Cards
                    </p>
                  </div>
                  <div className="mt-md">
                    <div className="w-full h-1 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
