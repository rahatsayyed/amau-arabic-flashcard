'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { clearSyncedLocalData } from '@/lib/supabase/progress';
import type { User } from '@supabase/supabase-js';

type TextSize = 'small' | 'medium' | 'large';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setUser(user));
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    clearSyncedLocalData();
    setUser(null);
    setSigningOut(false);
    router.push('/');
  };

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? 'Arabic Learner';

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-primary-container text-on-primary">
        <span className="font-headline-lg-mobile text-headline-lg-mobile">Settings</span>
        {avatarUrl ? (
          <Image src={avatarUrl} alt={displayName} width={36} height={36} className="w-9 h-9 rounded-full border-2 border-on-primary/30 object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px] text-on-primary">person</span>
          </div>
        )}
      </header>

      <div className="px-container-margin pb-md">

        {/* ── Account ──────────────────────────────────────────────────────── */}
        <SectionLabel>Account</SectionLabel>
        <div className="bg-surface rounded-2xl shadow-sm border border-primary-container/10 mb-md overflow-hidden">
          {/* Profile row */}
          <div className="flex items-center gap-3 px-md py-3 border-b border-primary/5">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={44} height={44} className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-title-md text-title-md text-on-surface truncate">{displayName}</p>
              <p className="font-label-md text-[12px] text-on-surface-variant truncate">
                {user?.email ?? 'Not signed in'}
              </p>
            </div>
          </div>
          {/* Subscription */}
          <ChevronRow
            icon="workspace_premium"
            label="Subscription Plan"
            right={<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-container/30 text-primary uppercase tracking-wide">Free</span>}
          />
        </div>

        {/* ── Learning Preferences ─────────────────────────────────────────── */}
        <SectionLabel>Learning Preferences</SectionLabel>
        <div className="bg-surface rounded-2xl shadow-sm border border-primary-container/10 mb-md overflow-hidden">
          <ChevronRow icon="flag" label="Daily Goal" right={<span className="text-on-surface-variant font-label-md text-label-md">20 cards</span>} />
          <ChevronRow icon="translate" label="Learning Dialect" right={<span className="text-on-surface-variant font-label-md text-label-md text-right max-w-[140px] leading-tight">Modern Standard Arabic</span>} divider />
          <ChevronRow icon="notifications" label="Reminder Notifications" right={<span className="text-on-surface-variant font-label-md text-label-md">20:00</span>} divider />
        </div>

        {/* ── Interface ────────────────────────────────────────────────────── */}
        <SectionLabel>Interface</SectionLabel>
        <div className="bg-surface rounded-2xl shadow-sm border border-primary-container/10 mb-md overflow-hidden">
          {/* Dark mode */}
          <div className="flex items-center justify-between px-md py-3 border-b border-primary/5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">dark_mode</span>
              <span className="font-body-md text-body-md text-on-surface">Dark Mode</span>
            </div>
            <button
              onClick={() => setDarkMode(d => !d)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${darkMode ? 'bg-secondary' : 'bg-outline-variant'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${darkMode ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
          {/* Text size */}
          <div className="px-md py-3">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">format_size</span>
              <span className="font-body-md text-body-md text-on-surface">Text Size</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as TextSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => setTextSize(size)}
                  className={`py-2 rounded-lg font-label-md text-label-md capitalize transition-all ${textSize === size ? 'bg-primary-container text-primary font-bold' : 'bg-surface-container text-on-surface-variant'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Data Management ──────────────────────────────────────────────── */}
        <SectionLabel>Data Management</SectionLabel>
        <div className="bg-surface rounded-2xl shadow-sm border border-primary-container/10 mb-md overflow-hidden">
          <Link href="/data" className="flex items-center justify-between px-md py-3 border-b border-primary/5 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">upload_file</span>
              <span className="font-body-md text-body-md text-on-surface">Import Decks</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
          </Link>
          <Link href="/data" className="flex items-center justify-between px-md py-3 hover:bg-surface-container-low transition-colors">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">download</span>
              <span className="font-body-md text-body-md text-on-surface">Export Decks</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
          </Link>
        </div>

        {/* ── Support & About ───────────────────────────────────────────────── */}
        <SectionLabel>Support & About</SectionLabel>
        <div className="bg-surface rounded-2xl shadow-sm border border-primary-container/10 mb-md overflow-hidden">
          <div className="flex items-center justify-between px-md py-3 border-b border-primary/5 opacity-50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">help</span>
              <span className="font-body-md text-body-md text-on-surface">Help Center</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">open_in_new</span>
          </div>
          <div className="flex items-center justify-between px-md py-3 opacity-50">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">policy</span>
              <span className="font-body-md text-body-md text-on-surface">Privacy Policy</span>
            </div>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">open_in_new</span>
          </div>
        </div>

        {/* ── Logout ───────────────────────────────────────────────────────── */}
        {user && (
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-secondary/10 text-secondary font-bold font-label-md text-label-md hover:bg-secondary/20 active:scale-[0.98] transition-all disabled:opacity-60 mb-sm"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {signingOut ? 'Signing out…' : 'Logout'}
          </button>
        )}

        {!user && (
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary-container text-on-primary font-bold font-label-md text-label-md hover:brightness-110 active:scale-[0.98] transition-all mb-sm"
          >
            <span className="material-symbols-outlined text-[20px]">login</span>
            Sign in with Google
          </Link>
        )}

        <p className="text-center font-label-md text-[11px] text-on-surface-variant/50">
          Arabic Flashcards v0.1 · AMAU Course
        </p>
      </div>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider px-1 mb-xs mt-md">
      {children}
    </p>
  );
}

function ChevronRow({
  icon,
  label,
  right,
  divider,
}: {
  icon: string;
  label: string;
  right?: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between px-md py-3 ${divider ? 'border-t border-primary/5' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-[20px] text-on-surface-variant">{icon}</span>
        <span className="font-body-md text-body-md text-on-surface">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {right}
        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">chevron_right</span>
      </div>
    </div>
  );
}
