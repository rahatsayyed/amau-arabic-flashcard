'use client';

import { useEffect, useRef, useState } from 'react';
import { ListSortDescending, ListSortAscending } from 'lucide-react';

export type SortMode = 'frequency' | 'alpha' | 'mastery';

interface SortBarProps {
  sortBy: SortMode;
  sortDir: 'asc' | 'desc';
  onSortByChange: (mode: SortMode) => void;
  onSortDirChange: (dir: 'asc' | 'desc') => void;
  onSortChange?: () => void;
}

const LABELS: Record<SortMode, string> = {
  frequency: 'Frequency',
  alpha: 'Alphabetical',
  mastery: 'Mastery Level',
};

export function SortBar({ sortBy, sortDir, onSortByChange, onSortDirChange, onSortChange }: SortBarProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleDir = () => {
    onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="relative" ref={ref}>
      <div className={`flex items-center rounded-lg transition-colors ${open ? 'bg-primary/5' : 'hover:bg-primary/5'}`}>
        <button
          onClick={toggleDir}
          className="p-1.5 active:scale-95 transition-transform relative w-[30px] h-[30px] flex items-center justify-center"
          title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
        >
          <span className={`absolute transition-all duration-200 ${sortDir === 'asc' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <ListSortAscending size={18} className="text-primary" />
          </span>
          <span className={`absolute transition-all duration-200 ${sortDir === 'desc' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            <ListSortDescending size={18} className="text-primary" />
          </span>
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-0.5 pr-1.5 py-1 active:scale-95 transition-transform"
        >
          <span className="font-label-md text-label-md text-primary">
            {sortBy === 'frequency' ? 'Frequency' : sortBy === 'alpha' ? 'Alphabetical' : 'Mastery'}
          </span>
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
            {open ? 'expand_less' : 'expand_more'}
          </span>
        </button>
      </div>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-primary/10 rounded-xl shadow-lg overflow-hidden z-50">
          {(['frequency', 'alpha', 'mastery'] as SortMode[]).map((opt, i) => (
            <button
              key={opt}
              onClick={() => {
                onSortByChange(opt);
                setOpen(false);
                onSortChange?.();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-left ${i > 0 ? 'border-t border-primary/5' : ''} ${sortBy === opt ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}
            >
              <span className={`font-label-md text-label-md ${sortBy === opt ? 'text-primary' : 'text-on-surface'}`}>
                {LABELS[opt]}
              </span>
              {sortBy === opt && (
                <span className="material-symbols-outlined text-secondary-container text-[18px]">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
