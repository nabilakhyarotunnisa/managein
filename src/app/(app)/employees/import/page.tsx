'use client';

import { useState, useRef } from 'react';
import { Loader2, Upload, FileSpreadsheet, FileText, XCircle, CheckCircle } from 'lucide-react';

export default function ImportEmployeesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [details, setDetails] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onChoose = (f: File | null) => {
    if (!f) return setFile(null);
    const ok =
      f.type.includes('csv') ||
      f.type.includes('sheet') ||
      f.name.toLowerCase().endsWith('.csv') ||
      f.name.toLowerCase().endsWith('.xlsx');
    if (!ok) {
      setMsg('Format tidak didukung. Pilih CSV atau Excel (.xlsx).');
      setDetails([]);
      setFile(null);
      return;
    }
    setMsg('');
    setDetails([]);
    setFile(f);
  };

  const onDrop: React.DragEventHandler<HTMLLabelElement> = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChoose(e.dataTransfer.files[0]);
    }
  };

  const submit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true); setMsg(''); setDetails([]);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/employees/import', { method: 'POST', body: fd });
      const json = await res.json();

      if (!res.ok) {
        setMsg(json.error || 'Import gagal');
        setDetails(json.details || []);
        return;
      }
      setMsg(`Berhasil impor: ${json.inserted} baru, ${json.updated} diperbarui, ${json.failed} gagal.`);
      setDetails([]);
      setFile(null);
      // reset input supaya bisa pilih file yang sama lagi kalau perlu
      if (inputRef.current) inputRef.current.value = '';
    } catch (err: any) {
      setMsg(err?.message ?? 'Import error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-500">Karyawan / Import</div>
          <h1 className="text-2xl font-semibold">Import Karyawan</h1>
          <p className="mt-1 text-sm text-gray-600">
            Format kolom: <code>full_name, email, nik, employment_status, is_active</code>
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/employees/template"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <FileText size={16} /> Template CSV
          </a>
          <a
            href="/api/employees/template-xlsx"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <FileSpreadsheet size={16} /> Template Excel
          </a>
        </div>
      </div>

      {/* Card */}
      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <form onSubmit={submit} className="space-y-5">
          {/* Dropzone */}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-gray-400 transition"
          >
            <div className="mx-auto w-12 h-12 grid place-items-center rounded-full bg-blue-50 text-blue-600">
              <Upload size={20} />
            </div>
            <div className="mt-3 font-medium">
              {file ? 'File siap diimpor' : 'Tarik & letakkan file di sini'}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              atau <span className="text-blue-600 underline">pilih file</span> (CSV / Excel .xlsx)
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx"
              onChange={(e) => onChoose(e.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </label>

          {/* Preview file terpilih */}
          {file && (
            <div className="flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2">
              <div className="flex items-center gap-3">
                <div className="rounded bg-white px-2 py-1 text-xs font-medium ring-1 ring-gray-200">
                  {file.name.split('.').pop()?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }}
                className="text-gray-500 hover:text-gray-700"
                title="Hapus"
              >
                <XCircle size={18} />
              </button>
            </div>
          )}

          {/* Alert / hasil */}
          {msg && (
            <div
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                details.length
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-700'
              }`}
            >
              {details.length ? <XCircle size={16} /> : <CheckCircle size={16} />}
              <div>
                <div>{msg}</div>
                {details.length > 0 && (
                  <ul className="mt-1 list-disc pl-5">
                    {details.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!file || loading}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {loading ? 'Mengimpor…' : 'Impor'}
            </button>
            <span className="text-xs text-gray-500">
              Tip: kolom <code>employment_status</code> → <code>permanent</code> / <code>contract</code> / <code>intern</code>.
            </span>
          </div>
        </form>
      </section>
    </main>
  );
}
