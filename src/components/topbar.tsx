'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Bell, HelpCircle, LogOut, Search } from "lucide-react";

export default function Topbar() {
  const r = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Ambil email user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  // Ambil role user
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id;
      if (!uid) return;
      const { data: rows } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', uid)
        .limit(1);
      setRole(rows?.[0]?.role ?? null);
    });
  }, []);

  const onLogout = async () => {
    await supabase.auth.signOut();
    await fetch('/auth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'SIGNED_OUT', session: null }),
    });
    r.push('/login');
  };

  const initials = userEmail ? userEmail[0].toUpperCase() : 'U';

  return (
    <header className="h-14 bg-blue-600 text-white sticky top-0 z-40 shadow">
      <div className="mx-auto max-w-[1400px] h-full px-4 flex items-center gap-3">
        <div className="font-semibold text-white/90">Managein</div>

        {/* Search */}
        <div className="ml-4 hidden md:flex items-center gap-2 bg-white/95 text-gray-700 rounded px-3 py-1.5 w-80">
          <Search size={16} className="text-gray-500" />
          <input
            className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400"
            placeholder="Cari karyawan, NIK, email…"
          />
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1">
          <button className="p-2 rounded hover:bg-white/10" title="Bantuan">
            <HelpCircle size={18} />
          </button>
          <button className="p-2 rounded hover:bg-white/10" title="Notifikasi">
            <Bell size={18} />
          </button>
          <button onClick={onLogout} className="p-2 rounded hover:bg-white/10" title="Keluar">
            <LogOut size={18} />
          </button>

          {/* Avatar & Role */}
          <div className="ml-2 w-8 h-8 rounded-full bg-white/90 text-blue-700 font-semibold grid place-items-center">
            {initials}
            </div>
            {role && (
            <span
                className={`ml-2 text-xs rounded-full px-2.5 py-0.5 capitalize font-medium
                ${role === 'admin' ? 'bg-red-500/85 text-white' :
                    role === 'manager' ? 'bg-green-500/85 text-white' :
                    'bg-blue-500/85 text-white'}`}
            >
                {role}
            </span>
            )}
                    </div>
      </div>
    </header>
  );
}
