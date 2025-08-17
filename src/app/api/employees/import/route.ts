import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

type Row = {
  full_name: string;
  email: string;
  nik?: string | null;
  employment_status?: 'permanent' | 'contract' | 'intern' | string;
  is_active?: boolean;
};

function parseBool(v: string | boolean | undefined) {
  if (typeof v === 'boolean') return v;
  if (!v) return true;
  const s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function parseCSV(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const header = (lines.shift() ?? '').split(',').map(h => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(',');
    const obj: Record<string,string> = {};
    header.forEach((h, i) => obj[h] = (cols[i] ?? '').trim());
    rows.push(obj);
  }
  return rows;
}

function parseXLSX(buf: ArrayBuffer) {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const json: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  // normalisasi header ke lowercase
  return json.map((r) => {
    const obj: Record<string, any> = {};
    Object.keys(r).forEach(k => obj[k.toLowerCase()] = r[k]);
    return obj;
  });
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // auth & role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok:false, error:'Unauthorized' }, { status:401, headers:{'Cache-Control':'no-store'} });

    const { data: prof } = await supabase.from('profiles').select('role').eq('id', user.id).limit(1);
    const role = prof?.[0]?.role ?? 'employee';
    const isApprover = role === 'admin' || role === 'manager';
    if (!isApprover) return NextResponse.json({ ok:false, error:'Hanya admin/manager yang boleh impor' }, { status:403 });

    // ambil file
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ ok:false, error:'File tidak ditemukan' }, { status:400 });

    const type = file.type || '';
    const name = file.name || '';
    const ext = name.split('.').pop()?.toLowerCase();
    let raw: Record<string, any>[] = [];

    if (type.includes('csv') || ext === 'csv') {
      const text = await file.text();
      raw = parseCSV(text);
    } else if (
      type.includes('sheet') || type.includes('excel') ||
      ext === 'xlsx' || ext === 'xls'
    ) {
      const buf = await file.arrayBuffer();
      raw = parseXLSX(buf);
    } else {
      return NextResponse.json({ ok:false, error:'Format tidak didukung. Pakai CSV atau XLSX.' }, { status:400 });
    }

    // validasi & normalisasi
    const rows: Row[] = [];
    const errors: string[] = [];
    raw.forEach((r, i) => {
      const ln = i + 2;
      const full_name = String(r['full_name'] ?? '').trim();
      const email = String(r['email'] ?? '').trim().toLowerCase();
      const nik = String(r['nik'] ?? '').trim() || null;
      const employment_status = String(r['employment_status'] ?? 'permanent').trim();
      const is_active = parseBool(r['is_active']);

      if (!full_name) errors.push(`Baris ${ln}: full_name kosong`);
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) errors.push(`Baris ${ln}: email tidak valid`);

      rows.push({ full_name, email, nik, employment_status, is_active });
    });

    if (errors.length) {
      return NextResponse.json({ ok:false, error:'Validasi gagal', details: errors }, { status:400 });
    }

    // upsert by email (update kalau ada, insert kalau belum)
    let updated = 0, inserted = 0, failed = 0;
    for (const r of rows) {
      const { data: existed, error: selErr } = await supabase
        .from('employees').select('id').eq('email', r.email).limit(1);
      if (selErr) { failed++; continue; }

      if (existed && existed.length > 0) {
        const { error: upErr } = await supabase
          .from('employees')
          .update({
            full_name: r.full_name,
            nik: r.nik,
            employment_status: r.employment_status ?? 'permanent',
            is_active: r.is_active ?? true,
          })
          .eq('id', existed[0].id);
        if (upErr) failed++; else updated++;
      } else {
        const { error: insErr } = await supabase
          .from('employees')
          .insert({
            full_name: r.full_name,
            email: r.email,
            nik: r.nik,
            employment_status: r.employment_status ?? 'permanent',
            is_active: r.is_active ?? true,
          });
        if (insErr) failed++; else inserted++;
      }
    }

    return NextResponse.json({ ok:true, inserted, updated, failed }, { headers:{'Cache-Control':'no-store'} });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'Import error' }, { status:500 });
  }
}
