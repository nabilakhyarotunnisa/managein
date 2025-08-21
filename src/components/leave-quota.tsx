'use client';
import { useEffect, useState } from 'react';

export default function LeaveQuota({ employeeId, year = new Date().getFullYear() }: { employeeId?: string; year?: number }) {
  const [data, setData] = useState<{quota:number; used:number} | null>(null);

  useEffect(() => {
    const qs = new URLSearchParams(employeeId ? { employeeId, year: String(year) } : { year: String(year) });
    fetch(`/api/leaves/balance?${qs.toString()}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(j => setData(j.data ?? { quota: 0, used: 0 }))
      .catch(() => setData({ quota: 0, used: 0 }));
  }, [employeeId, year]);

  if (!data) return <div className="text-sm text-gray-500">Memuat kuota…</div>;

  const { quota, used } = data;
  const remain = Math.max(0, (quota ?? 0) - (used ?? 0));
  const pct = quota ? Math.min(100, Math.round((used / quota) * 100)) : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>Cuti Tahunan {year}</span>
        <span>{remain} / {quota} hari tersisa</span>
      </div>
      <div className="h-2 rounded bg-gray-200 overflow-hidden">
        <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-xs text-gray-500">Terpakai: {used} hari</div>
    </div>
  );
}