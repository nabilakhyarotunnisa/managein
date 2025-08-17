'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SignupPage() {
  const r = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (error) throw error;
      toast.success('Pendaftaran berhasil! Silakan masuk ke akun Anda.');
      r.push('/login');
    } catch (e: any) {
      toast.error(e?.message ?? 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-700">Managein</h1>
          <p className="text-gray-600">Buat Akun Karyawan Baru</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white p-8 rounded-xl shadow-md space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Nama Lengkap</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="John Doe" required />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Email Perusahaan</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="nama@perusahaan.com" required />
          </div>
           <div>
            <label className="text-sm font-medium text-gray-700">Nomor Telepon</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="08123456789" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="••••••••" required />
          </div>

          {/* Elemen <p> untuk error sudah tidak diperlukan lagi */}

          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full rounded-md bg-blue-600 text-white py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Mendaftarkan...' : 'Daftar Akun'}
            </button>
          </div>

          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
