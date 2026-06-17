'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserProgress, getWeeklyActivity } from '@/lib/storage';
import { DECKS } from '@/data/vocabulary';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function ProfilePage() {
  const [progress, setProgress] = useState({
    streak: 0,
    totalCardsReviewed: 0,
    examScores: [] as { id: string; deckId: string; score: number; total: number; date: string }[],
  });
  const [activity, setActivity] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);

  useEffect(() => {
    const p = getUserProgress();
    setProgress({
      streak: p.streak,
      totalCardsReviewed: p.totalCardsReviewed,
      examScores: p.examScores.slice(-10).reverse(),
    });
    setActivity(getWeeklyActivity());
  }, []);

  const maxActivity = Math.max(...activity, 1);

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-primary-container text-on-primary">
        <span className="font-headline-lg-mobile text-headline-lg-mobile">Profile</span>
        <Link href="/login" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20">
          <span className="material-symbols-outlined text-[20px]">settings</span>
        </Link>
      </header>

      {/* Hero extends from header */}
      <div className="bg-primary-container -mt-px pb-12 px-container-margin flex flex-col items-center rounded-b-[40px] shadow-lg">
        <div className="relative mt-sm mb-sm">
          <div className="w-24 h-24 rounded-full border-4 border-on-secondary-container bg-surface shadow-md flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-container text-[52px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              person
            </span>
          </div>
          <div className="absolute bottom-0 right-0 bg-secondary text-on-secondary px-2 py-0.5 rounded-full font-label-md text-[11px] shadow-sm">
            FREE
          </div>
        </div>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-primary mb-1">Arabic Learner</h2>
        <p className="font-label-md text-label-md text-on-primary-container uppercase">AMAU Course Student</p>
      </div>

      <div className="px-container-margin pb-md">
        {/* Stats bento — float over hero */}
        <div className="-mt-base grid grid-cols-2 gap-sm mb-md">
          <div className="bg-surface p-md rounded-2xl shadow-sm border border-primary-container/10 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-secondary text-[36px] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
              local_fire_department
            </span>
            <span className="font-headline-lg text-headline-lg text-primary">{progress.streak}</span>
            <span className="font-label-md text-label-md text-on-surface-variant uppercase">Day Streak</span>
          </div>
          <div className="bg-surface p-md rounded-2xl shadow-sm border border-primary-container/10 flex flex-col items-center text-center">
            <span className="material-symbols-outlined text-primary-container text-[36px] mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
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
                  <span className={`font-label-md text-[10px] font-bold ${isToday ? 'text-secondary' : 'text-on-surface-variant'}`}>
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
                  <div key={score.id} className="bg-surface px-sm py-3 rounded-xl flex items-center justify-between border border-primary-container/5">
                    <div>
                      <p className="font-body-md text-body-md font-semibold text-on-surface">{deck?.title ?? score.deckId}</p>
                      <p className="font-label-md text-[11px] text-on-surface-variant">
                        {new Date(score.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-headline-lg text-[20px] ${pct >= 80 ? 'text-primary' : pct >= 60 ? 'text-on-tertiary-container' : 'text-secondary'}`}>
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

        {/* Sign-in promo */}
        <div className="bg-primary-container/5 border border-primary/10 rounded-2xl p-md">
          <h3 className="font-title-md text-title-md text-primary mb-1">Sync your progress</h3>
          <p className="font-body-md text-label-md text-on-surface-variant mb-md">
            Create an account to save progress across devices and unlock streak reminders.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-primary-container text-on-primary px-sm py-2.5 rounded-xl font-label-md text-label-md hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Sign In / Sign Up
          </Link>
        </div>
      </div>
    </>
  );
}
