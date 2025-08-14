'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function DebugPage() {
  const [ping, setPing] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [envOk, setEnvOk] = useState<boolean>(false);

  useEffect(() => {
    // cek env kebaca (URL & ANON harus ada)
    setEnvOk(!!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    // cek auth (kalau belum login ya null, itu normal)
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));

    // ping API route (cek DB & RLS policy)
    fetch('/api/ping')
      .then(r => r.json())
      .then(setPing)
      .catch(e => setPing({ ok: false, error: String(e) }));
  }, []);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Managein Debug</h1>

      <Section title="Env Loaded?">
        <pre className="text-sm">{JSON.stringify({ envOk }, null, 2)}</pre>
      </Section>

      <Section title="Auth getUser()">
        <pre className="text-sm">
{JSON.stringify({ user: user ? { id: user.id, email: user.email } : null }, null, 2)}
        </pre>
      </Section>

      <Section title="DB Ping (/api/ping)">
        <pre className="text-sm">{JSON.stringify(ping, null, 2)}</pre>
        <p className="text-xs text-gray-500">Kalau <code>ok:true</code> dan ada <code>note: "managein connected"</code>, berarti DB nyambung ✅</p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded p-4">
      <div className="font-medium mb-2">{title}</div>
      {children}
    </div>
  );
}
