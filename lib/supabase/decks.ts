import { createClient } from './client';
import type { CustomDeck } from '@/lib/storage';

function rowToDeck(row: Record<string, unknown>): CustomDeck {
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? '',
    icon: (row.icon as string) ?? 'book_2',
    isPublic: row.is_public as boolean,
    cards: (row.cards as CustomDeck['cards']) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function fetchMyDecks(): Promise<CustomDeck[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error || !data) return [];
  return data.map(rowToDeck);
}

export async function fetchPublicDecks(): Promise<CustomDeck[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('is_public', true)
    .neq('user_id', user?.id ?? '')
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(rowToDeck);
}

export async function upsertDeck(deck: CustomDeck): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('decks').upsert({
    id: deck.id,
    user_id: user.id,
    title: deck.title,
    description: deck.description,
    icon: deck.icon,
    is_public: deck.isPublic,
    cards: deck.cards,
    created_at: deck.createdAt,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteDeck(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.from('decks').delete().eq('id', id);
}
