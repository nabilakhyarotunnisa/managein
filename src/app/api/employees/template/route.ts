export const dynamic = 'force-dynamic';

export async function GET() {
  const header = 'full_name,email,nik,employment_status,is_active\n';
  const sample =
    'Budi Santoso,budi@acme.com,1234567890,permanent,true\n' +
    'Siti Aminah,siti@acme.com,,contract,true\n';
  return new Response(header + sample, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="employees_template.csv"',
      'Cache-Control': 'no-store',
    },
  });
}
