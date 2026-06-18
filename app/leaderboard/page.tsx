'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { fetchLeaderboard, fetchMyRank } from '@/lib/supabase/leaderboard';
import type { LeaderboardEntry } from '@/lib/supabase/leaderboard';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import type { User } from '@supabase/supabase-js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const PALETTE = ['#EC5238','#5B7FA6','#B07D3A','#6A5FA6','#3A9688','#7B8A3A','#A6455A','#4A7AA6','#5A8A5A','#A6783A'];

function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({
  entry,
  size,
  ring,
}: {
  entry: Pick<LeaderboardEntry, 'user_id' | 'display_name' | 'avatar_url'>;
  size: number;
  ring?: string;
}) {
  const sizeStyle = { width: size, height: size, minWidth: size };
  const ringStyle = ring ? { border: `4px solid ${ring}` } : {};

  if (entry.avatar_url) {
    return (
      <div className="rounded-full overflow-hidden flex-shrink-0" style={{ ...sizeStyle, ...ringStyle }}>
        <Image
          src={entry.avatar_url}
          alt={entry.display_name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{ ...sizeStyle, ...ringStyle, background: colorFromId(entry.user_id), fontSize: size * 0.3 }}
    >
      {initials(entry.display_name)}
    </div>
  );
}

function PodiumCard({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const isFirst = place === 1;
  const ringColor = place === 1 ? '#FACC15' : place === 2 ? '#CBD5E1' : '#B45309';
  const badgeBg   = place === 1 ? 'bg-primary'    : place === 2 ? 'bg-slate-300' : 'bg-amber-600';
  const badgeTxt  = place === 1 ? 'text-white'    : place === 2 ? 'text-slate-900' : 'text-white';
  const label     = place === 1 ? '1st'           : place === 2 ? '2nd'            : '3rd';

  return (
    <div className={`flex flex-col items-center ${isFirst ? '-translate-y-4' : ''}`}>
      <div className="relative">
        {isFirst && (
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <span className="material-symbols-outlined text-yellow-400 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              workspace_premium
            </span>
          </div>
        )}
        <Avatar entry={entry} size={isFirst ? 112 : 80} ring={ringColor} />
        <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${badgeBg} ${badgeTxt} font-bold text-xs px-3 py-1 rounded-full shadow-md whitespace-nowrap`}>
          {label}
        </div>
      </div>
      <p className={`text-white font-bold mt-5 truncate max-w-[90px] text-center ${isFirst ? 'text-base' : 'text-sm'}`}>
        {entry.display_name}
      </p>
      <p className={`font-bold text-sm ${isFirst ? 'text-yellow-400' : 'text-white/60'}`}>
        {entry.points.toLocaleString()} pts
      </p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-gutter py-3 animate-pulse">
      <div className="w-6 h-4 bg-surface-container-high rounded" />
      <div className="w-12 h-12 rounded-full bg-surface-container-high flex-shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 w-32 bg-surface-container-high rounded" />
        <div className="h-2.5 w-20 bg-surface-container-high rounded" />
      </div>
      <div className="h-4 w-14 bg-surface-container-high rounded" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const [user, setUser]           = useState<User | null | undefined>(undefined);
  const [entries, setEntries]     = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank]       = useState<{ rank: number; points: number } | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, board] = await Promise.all([
        createClient().auth.getUser(),
        fetchLeaderboard(50),
      ]);
      setUser(user ?? null);
      setEntries(board);

      if (user) {
        const rank = await fetchMyRank();
        setMyRank(rank);
      }
      setLoading(false);
    }
    load();
  }, []);

  const isLoggedIn = !!user;
  const top3       = entries.slice(0, 3);
  const rest       = entries.slice(3);

  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? 'You';
  const avatarUrl   = user?.user_metadata?.avatar_url as string | undefined;
  const meEntry: Pick<LeaderboardEntry, 'user_id' | 'display_name' | 'avatar_url'> = {
    user_id:      user?.id ?? 'me',
    display_name: displayName,
    avatar_url:   avatarUrl ?? null,
  };

  // Check if the current user is already in the visible list
  const myVisibleRank = user ? entries.findIndex(e => e.user_id === user.id) : -1;
  const showUserBar   = isLoggedIn && (myRank !== null || myVisibleRank >= 0);

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
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}
        />
        <p className="text-white/70 font-label-md text-[11px] text-center tracking-widest uppercase mb-8">
          Weekly Global League
        </p>

        {loading ? (
          <div className="flex items-end justify-center gap-4 max-w-sm mx-auto">
            {[80, 112, 80].map((sz, i) => (
              <div key={i} className={`flex flex-col items-center gap-3 ${i === 1 ? '-translate-y-4' : ''} animate-pulse`}>
                <div className="rounded-full bg-white/20" style={{ width: sz, height: sz }} />
                <div className="h-3 w-16 bg-white/20 rounded" />
                <div className="h-3 w-12 bg-white/20 rounded" />
              </div>
            ))}
          </div>
        ) : top3.length >= 3 ? (
          <div className="flex items-end justify-center gap-4 max-w-sm mx-auto">
            <PodiumCard entry={top3[1]} place={2} />
            <PodiumCard entry={top3[0]} place={1} />
            <PodiumCard entry={top3[2]} place={3} />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="material-symbols-outlined text-white/40 text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
            <p className="text-white/50 font-label-md text-sm">No data yet — start studying!</p>
          </div>
        )}
      </section>

      {/* Rank list */}
      <section className="bg-surface divide-y divide-primary/5">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
          : rest.map((entry, i) => {
              const rank = i + 4;
              const isMe = user?.id === entry.user_id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center justify-between px-gutter py-3 transition-colors ${isMe ? 'bg-primary-container/10' : 'hover:bg-surface-container-low'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-6 text-center font-bold font-label-md text-label-md ${isMe ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {rank}
                    </span>
                    <Avatar entry={entry} size={48} />
                    <div>
                      <p className={`font-title-md text-title-md ${isMe ? 'text-primary' : 'text-on-surface'}`}>
                        {entry.display_name}{isMe ? ' (you)' : ''}
                      </p>
                      <p className="font-label-md text-[11px] text-on-surface-variant">
                        {entry.total_cards_reviewed.toLocaleString()} cards · {entry.streak}d streak
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${isMe ? 'text-primary' : 'text-primary'}`}>{entry.points.toLocaleString()}</p>
                    <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider">Points</p>
                  </div>
                </div>
              );
            })
        }
      </section>

      {/* ── Logged-in user context bar ── */}
      {!loading && isLoggedIn && showUserBar && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="p-4 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-primary/20" style={{ background: '#17363B' }}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar entry={meEntry} size={48} />
                {myRank && (
                  <div className="absolute -top-1 -right-1 bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center font-bold" style={{ fontSize: 10 }}>
                    {myRank.rank > 99 ? '99+' : myRank.rank}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-sm text-white truncate max-w-[140px]">{displayName}</p>
                <p className="font-label-md text-[11px] text-white/60">
                  {myRank && myRank.rank <= 10 ? `Top ${myRank.rank <= 3 ? myRank.rank : '10'}!` : 'Keep studying to climb the ranks!'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="font-label-md text-[10px] text-white/60">Rank</p>
                <p className="font-bold text-primary">#{myRank?.rank ?? '–'}</p>
              </div>
              <div className="text-center">
                <p className="font-label-md text-[10px] text-white/60">Points</p>
                <p className="font-bold text-white">{(myRank?.points ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Sign-in prompt (logged out) ── */}
      {!loading && !isLoggedIn && (
        <div className="fixed bottom-20 left-4 right-4 z-40">
          <div className="bg-primary-container rounded-2xl shadow-2xl p-4 flex items-center gap-4 border border-primary/10">
            <span className="material-symbols-outlined text-on-primary text-[36px] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
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
