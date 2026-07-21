import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Journal, JournalType } from '../types/database';

const journalsKey = (userId: string | undefined) => ['journals', userId] as const;

export function useJournals() {
  const { session } = useAuth();
  const userId = session?.user.id;

  return useQuery({
    queryKey: journalsKey(userId),
    enabled: !!userId,
    queryFn: async (): Promise<Journal[]> => {
      const { data, error } = await supabase
        .from('journals')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateJournal() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, type }: { title: string; type: JournalType }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('journals')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);
      const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

      const { data, error } = await supabase
        .from('journals')
        .insert({ title, type, user_id: userId, sort_order: nextOrder })
        .select()
        .single();
      if (error) throw error;
      return data as Journal;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journalsKey(userId) }),
  });
}

export function useRenameJournal() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase.from('journals').update({ title }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journalsKey(userId) }),
  });
}

export function useDeleteJournal() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('journals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journalsKey(userId) }),
  });
}

export function useReorderJournals() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('journals').update({ sort_order: index }).eq('id', id)
        )
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: journalsKey(userId) }),
  });
}
