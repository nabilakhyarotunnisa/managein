'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Employee = {
  id?: string;
  full_name: string;
  email: string;
  nik?: string | null;
  employment_status: 'permanent' | 'contract' | 'intern' | string;
  is_active: boolean;
};

export default function EmployeeForm({
  initial,
  mode = 'create',
}: {
  initial?: Partial<Employee>;
  mode?: 'create' | 'edit';
}) {
  const r = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [form, setForm] = useState<Employee>({
    full_name: initial?.full_name ?? '',
    email: initial?.email ?? '',
    nik: initial?.nik ?? '',
    employment_status: (initial?.employment_status as any) ?? 'permanent',
    is_active: initial?.is_active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  // guard: hanya admin/manager
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/check-role');
      const json = await res.json();
      setRole(json?.role ?? null);
    })();
  }, []);

  const canEdit = role === 'admin' || role === 'manager';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { setErr('Akses ditolak: hanya admin/manager.'); return; }

    // validasi basic
    if (!form.full_name.trim()) { setErr('Nama wajib diisi.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) { setErr('Email tidak valid.'); return; }

    setLoading(true); setErr('');
    try {
      if (mode === 'create') {
        const { error } = await supabase.from('employees').insert({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          nik: form.nik?.trim() || null,
          employment_status: form.employment_status,
          is_active: form.is_active,
        });
        if (error) throw error;
        r.push('/employees');
      } else {
        const { error } = await supabase
          .from('employees')
          .update({
            full_name: form.full_name.trim(),
            email: form.email.trim().toLowerCase(),
            nik: form.nik?.trim() || null,
            employment_status: form.employment_status,
            is_active: form.is_active,
          })
          .eq('id', initial?.id);
        if (error) throw error;
        r.push('/employees');
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Gagal menyimpan data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {!canEdit && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Kamu bukan admin/manager. Form hanya mode baca.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm text-gray-600">Nama Lengkap</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={form.full_name}
            onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
            disabled={!canEdit}
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Email</label>
          <input
            type="email"
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
            disabled={!canEdit}
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">NIK</label>
          <input
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={form.nik ?? ''}
            onChange={(e) => setForm(f => ({ ...f, nik: e.target.value }))}
            disabled={!canEdit}
            placeholder="Opsional"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Status Karyawan</label>
          <select
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            value={form.employment_status}
            onChange={(e) => setForm(f => ({ ...f, employment_status: e.target.value as any }))}
            disabled={!canEdit}
          >
            <option value="permanent">Tetap</option>
            <option value="contract">Kontrak</option>
            <option value="intern">Magang</option>
          </select>
        </div>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            id="is_active"
            type="checkbox"
            className="h-4 w-4"
            checked={form.is_active}
            onChange={(e) => setForm(f => ({ ...f, is_active: e.target.checked }))}
            disabled={!canEdit}
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">Aktif</label>
        </div>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading || !canEdit}
          className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm disabled:opacity-60"
        >
          {loading ? 'Menyimpan…' : (mode === 'create' ? 'Simpan' : 'Update')}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
