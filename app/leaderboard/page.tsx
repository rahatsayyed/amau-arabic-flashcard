'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getUserProgress } from '@/lib/storage';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import type { User } from '@supabase/supabase-js';

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_LEADERS = [
  { rank: 1, name: 'Zaid Al-Harbi',   level: 24, tier: 'Platinum', points: 15820, initials: 'ZA', color: '#EC5238' },
  { rank: 2, name: 'Amina K.',        level: 20, tier: 'Platinum', points: 12450, initials: 'AK', color: '#5B7FA6' },
  { rank: 3, name: 'Nora S.',         level: 18, tier: 'Gold',     points: 11100, initials: 'NS', color: '#B07D3A' },
  { rank: 4, name: 'Sami Jaber',      level: 18, tier: 'Platinum', points:  9420, initials: 'SJ', color: '#6A5FA6' },
  { rank: 5, name: 'Laila Ibrahim',   level: 22, tier: 'Gold',     points:  8950, initials: 'LI', color: '#3A9688' },
  { rank: 6, name: 'Khalid Mansour',  level: 15, tier: 'Gold',     points:  8210, initials: 'KM', color: '#7B8A3A' },
  { rank: 7, name: 'Mariam Fawzi',    level: 12, tier: 'Silver',   points:  7840, initials: 'MF', color: '#A6455A' },
  { rank: 8, name: 'Yara Hassan',     level: 11, tier: 'Silver',   points:  7520, initials: 'YH', color: '#4A7AA6' },
  { rank: 9, name: 'Tariq Aziz',      level: 14, tier: 'Silver',   points:  7100, initials: 'TA', color: '#5A8A5A' },
  { rank: 10, name: 'Hana Bakir',     level:  9, tier: 'Bronze',   points:  6890, initials: 'HB', color: '#A6783A' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({
  initials,
  color,
  size = 48,
  avatarUrl,
  name,
  ring,
}: {
  initials: string;
  color: string;
  size?: number;
  avatarUrl?: string;
  name?: string;
  ring?: string;
}) {
  const sizeClass = size === 56 ? 'w-14 h-14' : size === 48 ? 'w-12 h-12' : size === 80 ? 'w-20 h-20' : 'w-28 h-28';
  const ringStyle = ring ? { border: `4px solid ${ring}` } : {};
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center overflow-hidden flex-shrink-0`}
      style={{ background: color, ...ringStyle }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name ?? initials} width={size} height={size} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-white" style={{ fontSize: size * 0.3 }}>{initials}</span>
      )}
    </div>
  );
}

function PodiumCard({
  entry,
  place,
}: {
  entry: typeof MOCK_LEADERS[0];
  place: 1 | 2 | 3;
}) {
  const isFirst = place === 1;
  const ringColor = place === 1 ? '#FACC15' : place === 2 ? '#CBD5E1' : '#B45309';
  const badgeBg = place === 1 ? 'bg-primary' : place === 2 ? 'bg-slate-300' : 'bg-amber-600';
  const badgeText = place === 1 ? 'text-white' : place === 2 ? 'text-slate-900' : 'text-white';
  const badgeLabel = place === 1 ? '1st' : place === 2 ? '2nd' : '3rd';
  const avatarSize = isFirst ? 112 : 80;

  return (
    <div className={`flex flex-col items-center ${isFirst ? '-translate-y-4' : ''} transition-transform`}>
      <div className="relative">
        {isFirst && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <span
              className="material-symbols-outlined text-yellow-400 text-[36px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              workspace_premium
            </span>
          </div>
        )}
        <Avatar initials={entry.initials} color={entry.color} size={avatarSize} ring={ringColor} />
        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${badgeBg} ${badgeText} font-bold text-xs px-3 py-1 rounded-full shadow-md whitespace-nowrap`}>
          {badgeLabel}
        </div>
      </div>
      <p className={`text-white font-bold mt-5 ${isFirst ? 'text-base' : 'text-sm'}`}>{entry.name}</p>
      <p className={`font-bold text-sm ${isFirst ? 'text-yellow-400' : 'text-white/60'}`}>
        {entry.points.toLocaleString()} pts
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user));
    const p = getUserProgress();
    setUserPoints(p.totalCardsReviewed * 10);
  }, []);

  const isLoading = user === undefined;
  const isLoggedIn = !!user;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? 'You';
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const estimatedRank = Math.max(11, MOCK_LEADERS.length + 1);

  return (
    <div className="pb-36">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Leaderboard</h1>
      </header>

      {/* Podium */}
      <section
        className="pt-8 pb-14 px-gutter rounded-b-[3rem] shadow-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #17363B 0%, #1c454b 100%)' }}
      >
        {/* dot grid overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />
        <p className="text-white/70 font-label-md text-[11px] text-center tracking-widest uppercase mb-8">
          Weekly Global League
        </p>
        <div className="flex items-end justify-center gap-4 w-full max-w-sm mx-auto">
          <PodiumCard entry={MOCK_LEADERS[1]} place={2} />
          <PodiumCard entry={MOCK_LEADERS[0]} place={1} />
          <PodiumCard entry={MOCK_LEADERS[2]} place={3} />
        </div>
      </section>

      {/* Rank list */}
      <section className="bg-surface divide-y divide-primary/5">
        {MOCK_LEADERS.slice(3).map(entry => (
          <div key={entry.rank} className="flex items-center justify-between px-gutter py-3 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-4">
              <span className="w-6 text-center font-bold font-label-md text-label-md text-on-surface-variant">
                {entry.rank}
              </span>
              <Avatar initials={entry.initials} color={entry.color} size={48} />
              <div>
                <p className="font-title-md text-title-md text-on-surface">{entry.name}</p>
                <p className="font-label-md text-[11px] text-on-surface-variant">Level {entry.level} · {entry.tier}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-primary">{entry.points.toLocaleString()}</p>
              <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Points</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── User context bar (logged in) ── */}
      {!isLoading && isLoggedIn && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div
            className="p-4 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-primary/20"
            style={{ background: '#17363B' }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar initials={initials} color="#EC5238" size={48} avatarUrl={avatarUrl} name={displayName} />
                <div className="absolute -top-1 -right-1 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ fontSize: 10 }}>
                  {estimatedRank}
                </div>
              </div>
              <div>
                <p className="font-bold text-sm text-white">{displayName}</p>
                <p className="font-label-md text-[11px] text-white/60">Keep studying to climb the ranks!</p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="font-label-md text-[10px] text-white/60">Rank</p>
                <p className="font-bold text-primary">#{estimatedRank}</p>
              </div>
              <div className="text-center">
                <p className="font-label-md text-[10px] text-white/60">Points</p>
                <p className="font-bold text-white">{userPoints.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign-in prompt (logged out) ── */}
      {!isLoading && !isLoggedIn && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-primary-container rounded-2xl shadow-2xl p-4 flex items-center gap-4 border border-primary/10">
            <span
              className="material-symbols-outlined text-on-primary text-[36px] flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              emoji_events
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-title-md text-title-md text-on-primary leading-tight">See your rank</p>
              <p className="font-label-md text-[11px] text-on-primary/70">Sign in to join the leaderboard</p>
            </div>
            <GoogleSignInButton
              label="Sign in"
              className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-on-primary text-primary font-bold font-label-md text-label-md flex-shrink-0 disabled:opacity-60"
            />
          </div>
        </div>
      )}
    </div>
  );
}
