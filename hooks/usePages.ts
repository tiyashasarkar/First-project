import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '../lib/supabase';
import type { Page } from '../types/database';

const pagesKey = (journalId: string) => ['pages', journalId] as const;

export function usePages(journalId: string) {
  return useQuery({
    queryKey: pagesKey(journalId),
    enabled: !!journalId,
    queryFn: async (): Promise<Page[]> => {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('journal_id', journalId)
        .order('date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePage(pageId: string) {
  return useQuery({
    queryKey: ['page', pageId],
    enabled: !!pageId,
    queryFn: async (): Promise<Page> => {
      const { data, error } = await supabase.from('pages').select('*').eq('id', pageId).single();
      if (error) throw error;
      return data as Page;
    },
  });
}

export function useCreatePage(journalId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('pages')
        .insert({ journal_id: journalId })
        .select()
        .single();
      if (error) throw error;
      return data as Page;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: pagesKey(journalId) }),
  });
}
