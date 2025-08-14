// src/app/(app)/layout.tsx
import Topbar from "@/components/topbar";
import Sidebar from "@/components/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Topbar />
      <div className="min-h-[calc(100vh-56px)] flex">
        <Sidebar />
        <main id="main" role="main" className="flex-1 px-4 py-6 md:px-6">
          <div className="mx-auto w-full max-w-[1200px]">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
