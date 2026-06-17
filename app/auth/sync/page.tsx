'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUserProgress } from '@/lib/storage';
import { fetchCloudProgress, saveProgressToCloud } from '@/lib/supabase/progress';
import type { UserProgress } from '@/lib/storage';

export default function AuthSyncPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';

  const [localProgress, setLocalProgress] = useState<UserProgress | null>(null);
  const [cloudProgress, setCloudProgress] = useState<UserProgress | null>(null);
  const [checking, setChecking] = useState(true);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    async function check() {
      const local = getUserProgress();
      const cloud = await fetchCloudProgress();

      const hasLocal = local.totalCardsReviewed > 0;
      const hasCloud = cloud !== null && cloud.totalCardsReviewed > 0;

      if (hasLocal && hasCloud) {
        setLocalProgress(local);
        setCloudProgress(cloud);
        setChecking(false);
        return;
      }

      // No conflict — auto-resolve
      if (hasCloud && !hasLocal) {
        // Apply cloud data to local
        localStorage.setItem('amau_progress', JSON.stringify(cloud));
      } else if (hasLocal && !hasCloud) {
        // Upload local data to cloud (fire and forget)
        saveProgressToCloud(local).catch(() => {});
      }

      router.replace(next);
    }

    check();
  }, [next, router]);

  const keepLocal = async () => {
    if (!localProgress || resolving) return;
    setResolving(true);
    await saveProgressToCloud(localProgress);
    router.replace(next);
  };

  const keepCloud = async () => {
    if (!cloudProgress || resolving) return;
    setResolving(true);
    localStorage.setItem('amau_progress', JSON.stringify(cloudProgress));
    router.replace(next);
  };

  if (checking) {
    return (
      <div className="h-dvh flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-md">
          <span className="material-symbols-outlined text-primary text-[48px] animate-spin">progress_activity</span>
          <p className="font-body-md text-label-md text-on-surface-variant">Syncing your progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh flex items-center justify-center bg-surface px-container-margin">
      <div className="w-full max-w-[360px] bg-surface rounded-2xl shadow-2xl p-lg flex flex-col gap-lg border border-primary/10">
        {/* Icon */}
        <div className="flex flex-col items-center text-center gap-sm">
          <div className="w-16 h-16 bg-secondary-container/20 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              sync
            </span>
          </div>
          <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-primary">Progress Conflict</h2>
          <p className="font-body-md text-label-md text-on-surface-variant leading-relaxed">
            We found progress on this device and in your account. Which one do you want to keep?
          </p>
        </div>

        {/* Options */}
        <div className="space-y-sm">
          {/* Local */}
          <button
            onClick={keepLocal}
            disabled={resolving}
            className="w-full rounded-xl border-2 border-outline-variant p-md text-left hover:border-secondary hover:bg-surface-container-lowest transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <div className="flex items-center justify-between mb-xs">
              <span className="font-title-md text-title-md text-primary">This device</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">smartphone</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {localProgress!.totalCardsReviewed} cards reviewed · {localProgress!.streak} day streak
            </p>
          </button>

          {/* Cloud */}
          <button
            onClick={keepCloud}
            disabled={resolving}
            className="w-full rounded-xl border-2 border-outline-variant p-md text-left hover:border-secondary hover:bg-surface-container-lowest transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <div className="flex items-center justify-between mb-xs">
              <span className="font-title-md text-title-md text-primary">Your account</span>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">cloud</span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {cloudProgress!.totalCardsReviewed} cards reviewed · {cloudProgress!.streak} day streak
            </p>
          </button>
        </div>

        {resolving && (
          <div className="flex items-center justify-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            <span className="font-label-md text-label-md">Applying…</span>
          </div>
        )}
      </div>
    </div>
  );
}
