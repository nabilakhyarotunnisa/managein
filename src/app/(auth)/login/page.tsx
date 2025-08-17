'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: sess } = await supabase.auth.getSession();
      await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'SIGNED_IN', session: sess.session }),
      });
      r.push('/dashboard');
    } catch (e: any) {
      toast.error(e?.message ?? 'Login gagal. Periksa kembali email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 grid place-items-center px-4">
      <div className="w-full max-w-5xl grid md:grid-cols-5 gap-8">
        {/* Brand / Info */}
        <div className="md:col-span-2 rounded-xl bg-white p-8 shadow-md">
          <div className="text-2xl font-bold text-blue-700">Managein</div>
          <p className="mt-2 text-sm text-gray-600">
            Portal absensi & cuti yang simpel buat HRD. Masuk untuk mulai kelola timmu.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <span className="text-blue-500">✔</span>
              <span>Check-in/out cepat</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">✔</span>
              <span>Ajukan & approve cuti</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">✔</span>
              <span>Laporan rapi & ekspor CSV</span>
            </li>
          </ul>
        </div>

        {/* Form */}
        <div className="md:col-span-3 bg-white p-8 rounded-xl shadow-md">
          <h1 className="text-2xl font-semibold">Masuk ke Akun Anda</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali!</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="nama@perusahaan.com"
                type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="••••••••"
                type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? 'Masuk...' : 'Masuk'}
              </button>
            </div>
            <p className="text-center text-sm text-gray-600">
              Belum punya akun?{' '}
              <Link href="/signup" className="font-medium text-blue-600 hover:underline">
                Daftar di sini
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
