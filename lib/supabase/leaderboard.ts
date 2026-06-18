import { createClient } from './client';

export interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_cards_reviewed: number;
  streak: number;
  points: number;
}

export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit });
  if (error || !data) return [];
  return (data as LeaderboardEntry[]).map(r => ({ ...r, points: Number(r.points) }));
}

export async function fetchMyRank(): Promise<{ rank: number; points: number } | null> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_my_rank');
  if (error || !data) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return { rank: Number(row.rank), points: Number(row.points) };
}

export async function upsertProfile(displayName: string, avatarUrl?: string | null): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').upsert({
    id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl ?? null,
    updated_at: new Date().toISOString(),
  });
}
