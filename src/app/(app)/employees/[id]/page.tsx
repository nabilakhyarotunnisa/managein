'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import EmployeeForm from '../_form';
import { useParams } from 'next/navigation';

export default function EditEmployeePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true); setErr('');
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('id, full_name, email, nik, employment_status, is_active, created_at')
          .eq('id', String(id))
          .limit(1);
        if (error) throw error;
        setData(data?.[0] ?? null);
      } catch (e:any) {
        setErr(e?.message ?? 'Gagal memuat data');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!data) return <div className="p-6">Data tidak ditemukan.</div>;

  return (
    <main className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Karyawan / Edit</div>
        <h1 className="text-2xl font-semibold">{data.full_name}</h1>
        <div className="text-sm text-gray-500">{data.email}</div>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <EmployeeForm mode="edit" initial={data} />
      </section>
    </main>
  );
}
