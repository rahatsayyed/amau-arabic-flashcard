'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getUserProgress, getWeeklyActivity } from '@/lib/storage';
import { DECKS } from '@/data/vocabulary';
import { createClient } from '@/lib/supabase/client';
import { clearSyncedLocalData } from '@/lib/supabase/progress';
import type { User } from '@supabase/supabase-js';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState({
    streak: 0,
    totalCardsReviewed: 0,
    examScores: [] as { id: string; deckId: string; score: number; total: number; date: string }[],
  });
  const [activity, setActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const p = getUserProgress();
    setProgress({
      streak: p.streak,
      totalCardsReviewed: p.totalCardsReviewed,
      examScores: p.examScores.slice(-10).reverse(),
    });
    setActivity(getWeeklyActivity());
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearSyncedLocalData();
    setUser(null);
    setSigningOut(false);
    router.refresh();
  };

  const maxActivity = Math.max(...activity, 1);
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? 'Arabic Learner';

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-primary-container text-on-primary">
        <span className="font-headline-lg-mobile text-headline-lg-mobile">Profile</span>
        {user ? (
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-white/10 hover:bg-white/20 font-label-md text-label-md text-on-primary transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        ) : (
          <Link
            href="/login"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
          </Link>
        )}
      </header>

      {/* Hero */}
      <div className="bg-primary-container -mt-px pb-12 px-container-margin flex flex-col items-center rounded-b-[40px] shadow-lg">
        <div className="mt-sm mb-sm">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full border-4 border-on-secondary-fixed-variant shadow-md object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-on-secondary-fixed-variant bg-surface shadow-md flex items-center justify-center">
              <span
                className="material-symbols-outlined text-primary-container text-[52px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                person
              </span>
            </div>
          )}
        </div>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary mb-1">{displayName}</h2>
        <p className="font-label-md text-label-md text-on-primary-container uppercase">
          {user ? user.email : 'AMAU Course Student'}
        </p>
      </div>

      <div className="px-container-margin pb-md">
        {/* Stats bento */}
        <div className="-mt-base grid grid-cols-2 gap-sm mb-md">
          <div className="bg-surface p-md rounded-2xl shadow-sm border border-primary-container/10 flex flex-col items-center text-center">
            <span
              className="material-symbols-outlined text-secondary text-[36px] mb-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              local_fire_department
            </span>
            <span className="font-headline-lg text-headline-lg text-primary">{progress.streak}</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Day Streak</span>
          </div>
          <div className="bg-surface p-md rounded-2xl shadow-sm border border-primary-container/10 flex flex-col items-center text-center">
            <span
              className="material-symbols-outlined text-primary-container text-[36px] mb-1"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              style
            </span>
            <span className="font-headline-lg text-headline-lg text-primary">{progress.totalCardsReviewed}</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Cards Reviewed</span>
          </div>
        </div>

        {/* Activity chart */}
        <div className="bg-surface p-md rounded-2xl shadow-sm border border-primary-container/10 mb-md">
          <div className="flex justify-between items-end mb-md">
            <div>
              <h3 className="font-title-md text-title-md text-primary">Learning Activity</h3>
              <p className="font-label-md text-[12px] text-on-surface-variant">Cards reviewed this week</p>
            </div>
            <div className="text-right">
              <span className="font-headline-lg text-headline-lg text-secondary">
                {activity.reduce((a, b) => a + b, 0)}
              </span>
              <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-tight">Total</p>
            </div>
          </div>
          <div className="flex items-end justify-between h-32 gap-1.5 px-1">
            {activity.map((val, i) => {
              const pct = Math.max((val / maxActivity) * 100, 4);
              const isToday = i === 6;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full bg-primary-container/10 rounded-t-lg relative flex flex-col justify-end overflow-hidden h-full">
                    <div
                      className={`${isToday ? 'bg-secondary' : 'bg-primary-container'} animate-bar w-full rounded-t-lg`}
                      style={{ '--bar-h': `${pct}%`, height: 0 } as React.CSSProperties}
                    />
                  </div>
                  <span
                    className={`font-label-md text-[10px] font-bold ${isToday ? 'text-secondary' : 'text-on-surface-variant'}`}
                  >
                    {DAYS[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent exam scores */}
        {progress.examScores.length > 0 && (
          <div className="mb-md">
            <h3 className="font-title-md text-title-md text-primary mb-sm">Recent Scores</h3>
            <div className="space-y-2">
              {progress.examScores.slice(0, 5).map(score => {
                const deck = DECKS.find(d => d.id === score.deckId);
                const pct = Math.round((score.score / score.total) * 100);
                return (
                  <div
                    key={score.id}
                    className="bg-surface px-sm py-3 rounded-xl flex items-center justify-between border border-primary-container/5"
                  >
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-on-surface">{deck?.title ?? score.deckId}</p>
                      <p className="font-label-md text-[11px] text-on-surface-variant">
                        {new Date(score.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-headline-lg text-[20px] ${pct >= 80 ? 'text-primary' : pct >= 60 ? 'text-on-tertiary-container' : 'text-secondary'}`}
                      >
                        {pct}%
                      </span>
                      <span className="font-label-md text-[12px] text-on-surface-variant">
                        {score.score}/{score.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sign-in promo — only shown to guests */}
        {!user && (
          <div className="bg-primary-container/5 border border-primary/10 rounded-2xl p-md">
            <h3 className="font-title-md text-title-md text-primary mb-1">Sync your progress</h3>
            <p className="font-body-md text-label-md text-on-surface-variant mb-md">
              Sign in with Google to save your decks and progress across devices.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-sm py-2.5 rounded-xl font-label-md text-label-md hover:brightness-110 transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Sign In with Google
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
