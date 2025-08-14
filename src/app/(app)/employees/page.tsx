'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';

type Row = {
  id: string;
  full_name: string;
  email: string;
  nik: string | null;
  employment_status: string | null;
  created_at?: string;
};

const PAGE_SIZE = 10;

export default function EmployeesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{col: 'full_name'|'email'|'created_at'; dir: 'asc'|'desc'}>({ col: 'full_name', dir: 'asc' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const from = (page-1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const load = async () => {
    setLoading(true); setErr('');
    try {
      // total
      const totalQuery = supabase
        .from('employees')
        .select('id', { count: 'exact', head: true });

      if (q) {
        totalQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,nik.ilike.%${q}%`);
      }
      const { count, error: cErr } = await totalQuery;
      if (cErr) throw cErr;
      setTotal(count ?? 0);

      // data page
      const listQuery = supabase
        .from('employees')
        .select('id,full_name,email,nik,employment_status,created_at')
        .order(sort.col, { ascending: sort.dir === 'asc' })
        .range(from, to);

      if (q) {
        listQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,nik.ilike.%${q}%`);
      }
      const { data, error } = await listQuery;
      if (error) throw error;
      setRows(data ?? []);
    } catch (e:any) {
      setErr(e.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q, sort]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const onSort = (col: 'full_name'|'email'|'created_at') => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Home / Karyawan</div>
          <h1 className="text-2xl font-semibold">Karyawan</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/employees/new" className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">Tambah</Link>
          <Link href="/employees/import" className="rounded-md border px-4 py-2 text-sm">Impor CSV</Link>
        </div>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={q}
            onChange={(e) => { setPage(1); setQ(e.target.value); }}
            placeholder="Cari nama, email, NIK…"
            className="w-full sm:w-80 rounded-md border px-3 py-2 text-sm"
          />
          <div className="text-sm text-gray-500">
            {loading ? 'Memuat…' : `${total} data`}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <Th onClick={() => onSort('full_name')} active={sort.col==='full_name'} dir={sort.dir}>Nama</Th>
                <Th onClick={() => onSort('email')} active={sort.col==='email'} dir={sort.dir}>Email</Th>
                <th className="p-2 text-left">NIK</th>
                <th className="p-2 text-left">Status</th>
                <Th onClick={() => onSort('created_at')} active={sort.col==='created_at'} dir={sort.dir}>Dibuat</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">
                    <Link href={`/employees/${r.id}`} className="text-blue-600 hover:underline">
                      {r.full_name}
                    </Link>
                  </td>
                  <td className="p-2">{r.email}</td>
                  <td className="p-2">{r.nik ?? '—'}</td>
                  <td className="p-2">
                    <span className="inline-flex rounded-full px-2 py-0.5 border bg-gray-50 text-gray-700">
                      {r.employment_status ?? '—'}
                    </span>
                  </td>
                  <td className="p-2 text-gray-500">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '—'}
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={5} className="p-6 text-center text-gray-500">Data kosong.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>Halaman {page} dari {pageCount}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page===1}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setPage(p => Math.min(pageCount, p+1))}
              disabled={page===pageCount}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >Next</button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Th({
  children, onClick, active, dir
}: { children: React.ReactNode; onClick?: ()=>void; active?: boolean; dir?: 'asc'|'desc'}) {
  return (
    <th
      className="p-2 text-left cursor-pointer select-none"
      onClick={onClick}
      title="Klik untuk sort"
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {active && <span className="text-gray-400">{dir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );
}
