import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient(); // ⬅️ penting: await

  const { data: rows, error } = await supabase
    .from('health_check')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1); // ambil array berisi 0/1 item

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const row = rows?.[0] ?? null; // ambil elemen pertama (atau null kalau kosong)
  return NextResponse.json({ ok: true, data: row });
}
