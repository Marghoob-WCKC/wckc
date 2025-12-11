"use client";

import React, { ReactNode, createContext, useMemo } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import useClerkToken from "@/hooks/useClerkToken";

export const SupabaseContext = createContext<SupabaseClient | null>(null);

export default function SupabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  const token = useClerkToken();
  const supabase = useMemo(() => {
    let headers = {};
    if (token) {
      headers = { Authorization: `Bearer ${token}` };
    }

    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers,
        },
      }
    );
  }, [token]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}
