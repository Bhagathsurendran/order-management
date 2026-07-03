// app/layout.tsx
// Root layout: provides React Query, dark mode, Sonner toasts, and global fonts.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "OrderDash — Real-Time Order Management",
  description:
    "Professional real-time order management dashboard with live WebSocket updates, analytics, and full CRUD operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
