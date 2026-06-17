'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    if (mode === 'signup') {
      setSuccess('Check your email to confirm your account!');
    } else {
      setError('Authentication not yet configured. Add Supabase keys to .env.local to enable login.');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between px-gutter h-16 bg-surface shadow-sm">
        <Link href="/" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-primary">arrow_back</span>
        </Link>
        <h1 className="font-title-md text-title-md text-primary">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h1>
        <div className="w-10" />
      </header>

      <div className="px-container-margin pt-lg pb-md">
        {/* Brand */}
        <div className="text-center mb-lg">
          <div className="w-20 h-20 rounded-[24px] bg-primary-container flex items-center justify-center mx-auto mb-sm shadow-lg">
            <span className="text-on-primary text-[40px] font-bold">ع</span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">AMĀU Arabic</h2>
          <p className="font-body-md text-label-md text-on-surface-variant mt-1">
            {mode === 'login' ? 'Welcome back, continue your journey' : 'Start your Arabic learning journey'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-sm">
          <div>
            <label className="font-label-md text-label-md text-on-surface block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
              className="w-full h-12 px-sm bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
            />
          </div>
          <div>
            <label className="font-label-md text-label-md text-on-surface block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full h-12 px-sm bg-surface-container-low border border-outline-variant rounded-xl font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/20 transition-all"
            />
          </div>

          {error && (
            <div className="bg-error-container text-on-error-container font-label-md text-label-md px-sm py-3 rounded-xl border border-error/20">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-[#ecfdf5] text-[#065f46] font-label-md text-label-md px-sm py-3 rounded-xl border border-[#bbf7d0]">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="pressable-btn w-full h-14 bg-secondary text-on-secondary rounded-xl font-label-md text-label-md mt-2 disabled:opacity-60"
          >
            {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Toggle mode */}
        <div className="text-center mt-md">
          <p className="font-body-md text-label-md text-on-surface-variant">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError(''); setSuccess(''); }}
              className="font-bold text-secondary hover:underline"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Guest notice */}
        <div className="mt-lg p-sm bg-surface-container-low rounded-2xl border border-primary/5">
          <p className="font-body-md text-label-md text-on-surface-variant text-center">
            <span className="font-bold text-primary">No account needed!</span> Your progress is saved locally.
            Sign in to sync across devices.
          </p>
          <Link
            href="/"
            className="mt-3 flex items-center justify-center gap-1.5 font-label-md text-label-md text-primary hover:underline"
          >
            Continue as guest
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </>
  );
}
