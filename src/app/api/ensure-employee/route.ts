import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();

  // 1) Cek user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) return NextResponse.json({ ok: false, error: userErr.message }, { status: 500 });
  if (!user)   return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // 2) Apakah sudah ada employees utk user ini? (array + limit(1))
  const { data: empRows, error: empErr } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (empErr) return NextResponse.json({ ok: false, error: empErr.message }, { status: 500 });
  if (empRows && empRows.length > 0) {
    return NextResponse.json({ ok: true, created: false });
  }

  // 3) Ambil profile (array + limit(1))
  const { data: profRows, error: profErr } = await supabase
    .from('profiles')
    .select('full_name,email')
    .eq('id', user.id)
    .limit(1);

  if (profErr) return NextResponse.json({ ok: false, error: profErr.message }, { status: 500 });

  const prof = profRows?.[0];
  const full_name = prof?.full_name ?? (user.email ?? 'User');
  const email = prof?.email ?? user.email ?? 'unknown@example.com';

  // 4) Insert employees
  const { error: insErr } = await supabase.from('employees').insert({
    user_id: user.id,
    full_name,
    email,
    employment_status: 'permanent',
    is_active: true,
  });

  if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, created: true });
}
