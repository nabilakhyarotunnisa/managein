'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { CalendarDays, Clock, LogIn, LogOut, User } from 'lucide-react';

type AttendanceRow = {
  id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'late' | 'leave' | 'sick' | 'absent' | string;
};

const fmtTime = (iso?: string | null) =>
  iso
    ? new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: true, timeZone: 'Asia/Jakarta'
      }).format(new Date(iso))
    : '—';

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function AttendancePage() {
  const [employee, setEmployee] = useState<{ id: string; name: string; email: string } | null>(null);
  const [todayData, setTodayData] = useState<AttendanceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setErr('Kamu belum login.'); return; }

      const { data: empRows, error: empErr } = await supabase
        .from('employees')
        .select('id, full_name, email')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (empErr) throw empErr;
      const emp = empRows?.[0];
      if (!emp) { setErr('Profil karyawan belum ada.'); return; }
      setEmployee({ id: emp.id, name: emp.full_name, email: emp.email });

      const { data: attRows, error: attErr } = await supabase
        .from('attendance')
        .select('id, date, check_in, check_out, status, created_at')
        .eq('employee_id', emp.id)
        .eq('date', todayStr())
        .order('created_at', { ascending: false })
        .limit(1);
      if (attErr) throw attErr;
      setTodayData(attRows?.[0] ?? null);
    } catch (e: any) {
      setErr(e?.message ?? 'Gagal memuat data');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const ensureEmployee = async () => {
    const res = await fetch('/api/ensure-employee', { method: 'POST' });
    if (res.ok) await load();
  };

  const checkIn = async () => {
    if (!employee?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('attendance').upsert({
        employee_id: employee.id,
        date: todayStr(),
        check_in: new Date().toISOString(),
        status: 'present',
      }, { onConflict: 'employee_id,date' });
      if (error) throw error;
      await load();
    } finally { setLoading(false); }
  };

  const checkOut = async () => {
    if (!todayData?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('attendance')
        .update({ check_out: new Date().toISOString() })
        .eq('id', todayData.id);
      if (error) throw error;
      await load();
    } finally { setLoading(false); }
  };

  const duration = useMemo(() => {
    if (!todayData?.check_in || !todayData?.check_out) return '—';
    const ms = +new Date(todayData.check_out) - +new Date(todayData.check_in);
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return `${h}j ${m}m`;
  }, [todayData]);

  const badge = (s?: string) => {
    const base = 'inline-flex rounded-full border px-3 py-1 text-xs font-medium';
    switch (s) {
      case 'present': return `${base} bg-green-50 text-green-700 border-green-200`;
      case 'late':    return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
      case 'leave':
      case 'sick':    return `${base} bg-blue-50 text-blue-700 border-blue-200`;
      case 'absent':  return `${base} bg-red-50 text-red-700 border-red-200`;
      default:        return `${base} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  if (loading) return <div className="mx-auto max-w-6xl p-6">Loading...</div>;

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      {/* breadcrumb/header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Home / Attendance</div>
          <h1 className="text-2xl font-semibold">Absensi</h1>
        </div>
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500">
          <CalendarDays size={16}/> {new Intl.DateTimeFormat('id-ID', { dateStyle:'full', timeZone:'Asia/Jakarta' }).format(new Date())}
        </div>
      </div>

      {err ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err}
          {err.includes('Profil karyawan') && (
            <button onClick={ensureEmployee} className="ml-3 rounded bg-black text-white px-3 py-1">
              Buat profil
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Kiri: Profil singkat */}
          <section className="md:col-span-1">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                  <User />
                </div>
                <div>
                  <div className="font-medium">{employee?.name ?? '—'}</div>
                  <div className="text-sm text-gray-500">{employee?.email ?? ''}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock size={16}/> <span>Zona waktu: Asia/Jakarta</span>
                </div>
              </div>
            </div>
          </section>

          {/* Kanan: Detail hari ini */}
          <section className="md:col-span-2">
            <div className="rounded-lg border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500">Status Hari Ini</div>
                  <div className="flex items-center gap-2">
                    <span className={badge(todayData?.status)}>{todayData?.status ?? '—'}</span>
                    <span className="text-sm text-gray-500">Durasi: <strong>{duration}</strong></span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!todayData?.check_in && (
                    <button onClick={checkIn} className="inline-flex items-center gap-2 rounded bg-blue-600 text-white px-4 py-2">
                      <LogIn size={16}/> Check-in
                    </button>
                  )}
                  {todayData?.check_in && !todayData?.check_out && (
                    <button onClick={checkOut} className="inline-flex items-center gap-2 rounded bg-emerald-600 text-white px-4 py-2">
                      <LogOut size={16}/> Check-out
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <div className="rounded border p-3">
                  <div className="text-sm text-gray-500">Check-in</div>
                  <div className="text-xl font-bold">{fmtTime(todayData?.check_in)}</div>
                </div>
                <div className="rounded border p-3">
                  <div className="text-sm text-gray-500">Check-out</div>
                  <div className="text-xl font-bold">{fmtTime(todayData?.check_out)}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* — Riwayat 7 hari bakal kita tampilkan di bawah section ini — */}
    </main>
  );
}
