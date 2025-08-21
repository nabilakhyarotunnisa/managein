import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();

  // siapa approval-nya?
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) return NextResponse.json({ ok:false, error:'Unauthorized' }, { status:401 });

  // guard role
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).limit(1);
  const role = prof?.[0]?.role ?? 'employee';
  if (!['admin','manager'].includes(role)) {
    return NextResponse.json({ ok:false, error:'Forbidden' }, { status:403 });
  }

  // panggil fungsi DB (atomik)
  const { error } = await supabase.rpc('approve_leave', { p_leave_id: params.id, p_approver: user.id });
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:400 });

  return NextResponse.json({ ok:true });
}
