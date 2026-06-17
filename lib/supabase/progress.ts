import { createClient } from './client';
import type { UserProgress } from '@/lib/storage';

export async function fetchCloudProgress(): Promise<UserProgress | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    streak: data.streak ?? 0,
    lastStudyDate: data.last_study_date ?? '',
    totalCardsReviewed: data.total_cards_reviewed ?? 0,
    cardStates: data.card_states ?? {},
    examScores: data.exam_scores ?? [],
    activityByDay: data.activity_by_day ?? {},
  };
}

export async function saveProgressToCloud(progress: UserProgress): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_progress').upsert({
    user_id: user.id,
    streak: progress.streak,
    last_study_date: progress.lastStudyDate,
    total_cards_reviewed: progress.totalCardsReviewed,
    card_states: progress.cardStates,
    exam_scores: progress.examScores,
    activity_by_day: progress.activityByDay,
    updated_at: new Date().toISOString(),
  });
}

export function clearSyncedLocalData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('amau_progress');
  localStorage.removeItem('amau_custom_decks');
  localStorage.removeItem('amau_card_overrides');
}
