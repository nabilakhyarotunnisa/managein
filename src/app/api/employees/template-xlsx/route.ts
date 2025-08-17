export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const mod = await import('xlsx/xlsx.mjs').catch(() => import('xlsx'));
  const XLSX: any = (mod as any).default ?? mod;

  const rows = [
    ['full_name','email','nik','employment_status','is_active'],
    ['Budi Santoso','budi@acme.com','1234567890','permanent','true'],
    ['Siti Aminah','siti@acme.com','','contract','true'],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Employees');

  // ArrayBuffer → Response OK
  const ab: ArrayBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  return new Response(new Uint8Array(ab), {
    headers: {
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="employees_template.xlsx"',
      'Cache-Control': 'no-store',
    },
  });
}