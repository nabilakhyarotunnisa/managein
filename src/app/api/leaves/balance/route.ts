import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const employeeId = url.searchParams.get('employeeId');
  const year = Number(url.searchParams.get('year') || new Date().getFullYear());

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:'Unauthorized' }, { status:401 });

  // kalau employeeId kosong → ambil employee_id diri sendiri
  let empId = employeeId;
  if (!empId) {
    const { data: me } = await supabase
      .from('employees').select('id').eq('user_id', user.id).limit(1);
    empId = me?.[0]?.id ?? null;
  }
  if (!empId) return NextResponse.json({ ok:false, error:'No employee id' }, { status:400 });

  // ensure row ada
  await supabase.rpc('ensure_leave_balance', { p_employee_id: empId, p_year: year, p_default_quota: 12 });

  const { data, error } = await supabase
    .from('leave_balances')
    .select('id,employee_id,year,quota,used,updated_at')
    .eq('employee_id', empId)
    .eq('year', year)
    .limit(1);
  if (error) return NextResponse.json({ ok:false, error: error.message }, { status:500 });

  return NextResponse.json({ ok:true, data: data?.[0] ?? null });
}
