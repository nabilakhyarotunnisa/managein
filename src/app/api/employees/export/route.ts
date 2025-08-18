export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toCSV(rows: any[]) {
  const header = ['full_name','email','nik','employment_status','is_active','created_at'];
  const esc = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      esc(r.full_name), esc(r.email), esc(r.nik),
      esc(r.employment_status), esc(r.is_active),
      esc(r.created_at)
    ].join(','));
  }
  return lines.join('\n');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = (searchParams.get('format') || 'csv').toLowerCase();
  const q = (searchParams.get('q') || '').trim();
  const sort = (searchParams.get('sort') || 'full_name') as 'full_name'|'email'|'created_at';
  const dir = (searchParams.get('dir') || 'asc') as 'asc'|'desc';

  // Supabase server client
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();

  // (opsional) role guard: hanya admin/manager
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).limit(1);
  const role = prof?.[0]?.role ?? 'employee';
  const isApprover = role === 'admin' || role === 'manager';
  if (!isApprover) return new Response('Forbidden', { status: 403 });

  // query data
  const qList = supabase
    .from('employees')
    .select('full_name,email,nik,employment_status,is_active,created_at')
    .order(sort, { ascending: dir === 'asc' });

  if (q) qList.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,nik.ilike.%${q}%`);

  const { data, error } = await qList;
  if (error) return new Response(error.message, { status: 500 });

  if (format === 'xlsx') {
    const mod = await import('xlsx/xlsx.mjs').catch(() => import('xlsx'));
    const XLSX: any = (mod as any).default ?? mod;

    const rows = (data ?? []).map(r => ({
      full_name: r.full_name,
      email: r.email,
      nik: r.nik,
      employment_status: r.employment_status,
      is_active: r.is_active,
      created_at: r.created_at
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows, { header: ['full_name','email','nik','employment_status','is_active','created_at'] });
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    const ab: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

    return new Response(new Uint8Array(ab), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="employees_${Date.now()}.xlsx"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // default: CSV
  const csv = toCSV(data ?? []);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="employees_${Date.now()}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
