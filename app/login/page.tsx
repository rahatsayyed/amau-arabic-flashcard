'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
    // On success the browser navigates to Google — no need to setLoading(false)
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <h1 className="font-title-md text-title-md text-primary">Sign In</h1>
        <div className="w-10" />
      </header>

      <div className="px-container-margin pt-lg pb-md flex flex-col items-center">
        {/* Brand */}
        <div className="text-center mb-xl">
          <div className="w-24 h-24 rounded-[28px] bg-primary-container flex items-center justify-center mx-auto mb-md shadow-lg">
            <span className="text-on-primary text-[48px] font-bold">ع</span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">AMĀU Arabic</h2>
          <p className="font-body-md text-label-md text-on-surface-variant mt-1">
            Continue your Arabic learning journey
          </p>
        </div>

        {/* Google sign-in */}
        <div className="w-full space-y-sm">
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full h-14 bg-surface border-2 border-outline-variant rounded-2xl flex items-center justify-center gap-3 font-label-md text-label-md text-on-surface hover:bg-surface-container-lowest hover:border-secondary transition-all active:scale-[0.98] disabled:opacity-60 shadow-sm"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            ) : (
              /* Google logo SVG */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          {error && (
            <div className="bg-error-container text-on-error-container font-label-md text-label-md px-sm py-3 rounded-xl border border-error/20 text-center">
              {error}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-sm w-full my-lg">
          <div className="flex-1 h-px bg-outline-variant" />
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-xs">or</span>
          <div className="flex-1 h-px bg-outline-variant" />
        </div>

        {/* Guest option */}
        <div className="w-full bg-surface-container-low rounded-2xl border border-primary/5 p-md">
          <p className="font-body-md text-label-md text-on-surface-variant text-center mb-md">
            <span className="font-bold text-primary">No account needed.</span> Progress is saved locally on this device. Sign in to sync across devices.
          </p>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 font-label-md text-label-md text-primary hover:underline"
          >
            Continue as guest
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </>
  );
}
