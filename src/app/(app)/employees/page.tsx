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

  // 🔹 debounce search
  const [rawQ, setRawQ] = useState('');
  const q = useDebounce(rawQ, 300);

  const [sort, setSort] = useState<{ col: 'full_name' | 'email' | 'created_at'; dir: 'asc' | 'desc' }>({ col: 'full_name', dir: 'asc' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const load = async () => {
    setLoading(true); setErr('');
    try {
      // total
      const totalQuery = supabase.from('employees').select('id', { count: 'exact', head: true });
      if (q) totalQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,nik.ilike.%${q}%`);
      const { count, error: cErr } = await totalQuery;
      if (cErr) throw cErr;
      setTotal(count ?? 0);

      // data page
      const listQuery = supabase
        .from('employees')
        .select('id,full_name,email,nik,employment_status,created_at')
        .order(sort.col, { ascending: sort.dir === 'asc' })
        .range(from, to);
      if (q) listQuery.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,nik.ilike.%${q}%`);

      const { data, error } = await listQuery;
      if (error) throw error;
      setRows(data ?? []);
    } catch (e: any) {
      setErr(e.message ?? 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  // 🔹 trigger load saat page/sort/q (debounced) berubah
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q, sort]);

  const pageCount = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  const onSort = (col: 'full_name' | 'email' | 'created_at') => {
    setSort(s => s.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  };

  // 🔹 URL export ikut filter & sort
  const exportBase = `/api/employees/export?q=${encodeURIComponent(q)}&sort=${sort.col}&dir=${sort.dir}`;
  const exportCsv = `${exportBase}&format=csv`;
  const exportXlsx = `${exportBase}&format=xlsx`;

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Home / Karyawan</div>
          <h1 className="text-2xl font-semibold">Karyawan</h1>
        </div>
        <div className="flex gap-2">
          <a href={exportCsv} className="rounded-md border px-4 py-2 text-sm">Export CSV</a>
          <a href={exportXlsx} className="rounded-md border px-4 py-2 text-sm">Export Excel</a>
          <Link href="/employees/import" className="rounded-md border px-4 py-2 text-sm">Impor CSV/XLSX</Link>
          <Link href="/employees/new" className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">Tambah</Link>
        </div>
      </div>

      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            value={rawQ}
            onChange={(e) => { setPage(1); setRawQ(e.target.value); }}
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
                <Th onClick={() => onSort('full_name')} active={sort.col === 'full_name'} dir={sort.dir}>Nama</Th>
                <Th onClick={() => onSort('email')} active={sort.col === 'email'} dir={sort.dir}>Email</Th>
                <th className="p-2 text-left">NIK</th>
                <th className="p-2 text-left">Status</th>
                <Th onClick={() => onSort('created_at')} active={sort.col === 'created_at'} dir={sort.dir}>Dibuat</Th>
              </tr>
            </thead>

            {/* 🔹 Skeleton saat loading */}
            {loading ? (
              <TableSkeleton rows={PAGE_SIZE} cols={5} />
            ) : (
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
                      <StatusBadge value={r.employment_status} />
                    </td>
                    <td className="p-2 text-gray-500">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '—'}
                    </td>
                  </tr>
                ))}
                {/* 🔹 Empty state */}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="text-lg font-medium">Belum ada data</div>
                        <p className="mt-1 text-sm text-gray-500">
                          Tambahkan karyawan baru atau impor dari CSV/Excel.
                        </p>
                        <div className="mt-4 flex justify-center gap-2">
                          <Link href="/employees/new" className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">Tambah Karyawan</Link>
                          <Link href="/employees/import" className="rounded-md border px-4 py-2 text-sm">Impor CSV/XLSX</Link>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>Halaman {page} dari {pageCount}</div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >Prev</button>
            <button
              onClick={() => setPage(p => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              className="rounded border px-3 py-1 disabled:opacity-50"
            >Next</button>
          </div>
        </div>

        {/* Error text (kalau ada) */}
        {err && <div className="mt-3 text-sm text-red-600">{err}</div>}
      </section>
    </main>
  );
}

/* ===== Helpers ===== */

function Th({ children, onClick, active, dir }: { children: React.ReactNode; onClick?: () => void; active?: boolean; dir?: 'asc' | 'desc' }) {
  return (
    <th className="p-2 text-left cursor-pointer select-none" onClick={onClick} title="Klik untuk sort">
      <span className="inline-flex items-center gap-1">
        {children}
        {active && <span className="text-gray-400">{dir === 'asc' ? '▲' : '▼'}</span>}
      </span>
    </th>
  );
}

function TableSkeleton({ rows = 10, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-t">
          {Array.from({ length: cols }).map((__, j) => (
            <td key={j} className="p-2">
              <div className="h-3 w-full max-w-[220px] rounded bg-gray-100" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

function StatusBadge({ value }: { value: string | null }) {
  const v = (value ?? '—').toLowerCase();
  const styles =
    v === 'permanent' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
    v === 'contract'  ? 'bg-amber-50 text-amber-700 ring-amber-200' :
    v === 'intern'    ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                        'bg-gray-50 text-gray-700 ring-gray-200';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles}`}>
      {value ?? '—'}
    </span>
  );
}

/* Debounce hook kecil */
function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
