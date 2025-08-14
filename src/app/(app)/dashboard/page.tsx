import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function Dashboard() {
  await requireAuth();
  const supabase = await createClient();
  const { data: rows } = await supabase.from('v_dashboard').select('*').limit(1);
  const stats = rows?.[0] ?? { total_employees: 0, present_today: 0, on_leave_today: 0 };

  return (
    <main className="mx-auto max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Home / Dashboard</div>
          <h1 className="text-2xl font-semibold">Ringkasan HR</h1>
        </div>
        <div className="hidden md:flex gap-2">
          <Link href="/attendance" className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm">
            Buka Absensi
          </Link>
          <Link href="/employees" className="rounded-md border px-4 py-2 text-sm">
            Kelola Karyawan
          </Link>
        </div>
      </div>

      {/* Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Total Karyawan" value={stats.total_employees} subtitle="Aktif saat ini" />
        <Card title="Hadir Hari Ini" value={stats.present_today} subtitle="Check-in tercatat" />
        <Card title="Cuti Hari Ini" value={stats.on_leave_today} subtitle="Disetujui & aktif" />
      </section>

      {/* Quick actions */}
      <section className="rounded-xl border bg-white p-5">
        <div className="font-semibold">Aksi Cepat</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          <Quick href="/attendance" title="Absensi" desc="Check-in / Check-out" />
          <Quick href="/leaves" title="Cuti/Izin" desc="Ajukan & approval" />
          <Quick href="/employees" title="Data Karyawan" desc="Tambah / edit / impor CSV" />
        </div>
      </section>
    </main>
  );
}

function Card({ title, value, subtitle }:{title:string; value:number; subtitle?:string}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
      {subtitle && <div className="mt-1 text-xs text-gray-500">{subtitle}</div>}
    </div>
  );
}

function Quick({ href, title, desc }:{href:string; title:string; desc:string}) {
  return (
    <Link href={href} className="rounded-lg border bg-white p-4 hover:shadow-sm transition">
      <div className="font-medium">{title}</div>
      <div className="text-sm text-gray-600">{desc}</div>
    </Link>
  );
}
