'use client';

import { useRouter } from 'next/navigation';

interface TopAppBarProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
  variant?: 'default' | 'primary';
}

export default function TopAppBar({ title, showBack, actions, variant = 'default' }: TopAppBarProps) {
  const router = useRouter();

  const bg = variant === 'primary'
    ? 'bg-primary-container text-on-primary'
    : 'bg-surface text-primary shadow-sm';

  return (
    <header className={`sticky top-0 z-50 flex items-center justify-between px-gutter h-16 ${bg}`}>
      <div className="flex items-center gap-sm">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        )}
        {!showBack && variant === 'primary' && (
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10">
            <span className="font-bold text-on-primary text-xl">ع</span>
          </div>
        )}
        <span className="font-headline-lg-mobile text-headline-lg-mobile tracking-tight">{title}</span>
      </div>
      {actions && <div className="flex items-center gap-sm">{actions}</div>}
    </header>
  );
}
