'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: sess } = await supabase.auth.getSession();
      await fetch('/auth/callback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'SIGNED_IN', session: sess.session }),
      });

      await fetch('/api/ensure-employee', { method: 'POST' });
      r.push('/dashboard');
    } catch (e: any) {
      setErr(e?.message ?? 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-56px)] grid place-items-center px-4">
      <div className="w-full max-w-5xl grid md:grid-cols-5 gap-6">
        {/* Brand / Info */}
        <div className="md:col-span-2 rounded-xl border bg-white p-6">
          <div className="text-2xl font-semibold text-blue-700">Managein</div>
          <p className="mt-2 text-sm text-gray-600">
            Portal absensi & cuti yang simpel buat HRD. Masuk untuk mulai kelola timmu.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-gray-700">
            <li>• Check-in/out cepat</li>
            <li>• Ajukan & approve cuti</li>
            <li>• Laporan rapi & ekspor CSV</li>
          </ul>
        </div>

        {/* Form */}
        <div className="md:col-span-3 rounded-xl border bg-white p-6">
          <h1 className="text-xl font-semibold">Masuk ke akun</h1>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="nama@perusahaan.com"
                type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="••••••••"
                type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required
              />
            </div>

            {err && <p className="text-sm text-red-600">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
            <p className="text-xs text-gray-500">
              Belum punya akun? <a href="/signup" className="underline">Daftar</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
