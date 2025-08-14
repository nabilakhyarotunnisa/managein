'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, CalendarCheck2, Users, FileClock, Settings, LayoutGrid
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/attendance", label: "Absensi", icon: CalendarCheck2 },
  { href: "/employees", label: "Karyawan", icon: Users },
  { href: "/leaves", label: "Cuti/Izin", icon: FileClock },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-16 md:w-60 shrink-0 border-r bg-white">
      <div className="mx-auto max-w-[1400px]">
        {/* Mini brand untuk layar kecil */}
        <div className="hidden md:flex items-center gap-2 px-3 h-12 text-gray-500">
          <LayoutGrid size={18} />
          <span className="text-sm">Menu</span>
        </div>
        <nav className="p-2 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 rounded px-3 py-2 text-sm",
                  active
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                ].join(" ")}
              >
                <Icon size={18} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
