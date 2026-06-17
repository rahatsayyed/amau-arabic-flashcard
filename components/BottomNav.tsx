'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', icon: 'home', label: 'Home' },
  { href: '/decks', icon: 'style', label: 'Decks' },
  { href: '/profile', icon: 'person', label: 'Profile' },
  { href: '/login', icon: 'settings', label: 'Settings' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="w-full flex justify-around items-center px-2 py-3 bg-surface shadow-lg rounded-t-xl border-t border-surface-container-high flex-shrink-0">
      {NAV_ITEMS.map(item => {
        const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-4 py-1.5 rounded-xl transition-all active:scale-95 duration-200 ${
              active
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="font-label-md text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
