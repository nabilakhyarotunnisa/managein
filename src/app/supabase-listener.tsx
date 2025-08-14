'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function SupabaseListener() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Sinkronkan ke server biar cookies kebentuk
        await fetch('/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, session }),
        });
      }
    );
    return () => subscription.unsubscribe();
  }, []);

  return null;
}

