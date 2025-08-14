import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

export async function requireAuth() {
  const supabase = await createClient(); // ⬅️ WAJIB await

  const { data: { user }, error } = await supabase.auth.getUser();

  // (opsional) log biar gampang debug
  if (error) {
    console.error('requireAuth getUser error:', error);
  }

  if (!user) redirect('/login');
  return user;
}
