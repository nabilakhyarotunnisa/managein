import EmployeeForm from '../_form';

export default function NewEmployeePage() {
  return (
    <main className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Karyawan / Tambah</div>
        <h1 className="text-2xl font-semibold">Tambah Karyawan</h1>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
        <EmployeeForm mode="create" />
      </section>
    </main>
  );
}
