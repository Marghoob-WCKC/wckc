"use client";

import { useContext } from 'react';
import { SupabaseContext } from '@/providers/SupabaseProvider';
import { ClerkTokenContext } from '@/providers/ClerkTokenProvider';

/**
 * Hook that returns both the authenticated Supabase client and token from context
 */
export function useSupabase() {
  const supabase = useContext(SupabaseContext);
  const token = useContext(ClerkTokenContext);

  if (!supabase) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }

  return { supabase, token };
}
