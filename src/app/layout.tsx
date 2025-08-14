// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import SupabaseListener from "./supabase-listener";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Managein",
  description: "HR management MVP — attendance, leave, and employee directory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900`}>
        <SupabaseListener />
        {children}
      </body>
    </html>
  );
}
