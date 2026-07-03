"use client";

// components/Sidebar.tsx
// Collapsible sidebar navigation with active route highlighting.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, X } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, setSidebarOpen } = useUIStore();

  // Close sidebar drawer automatically on route navigation
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  return (
    <>
      {/* Backdrop overlay for mobile menu */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] z-40 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col h-full w-64 bg-white border-r border-slate-200 transition-transform duration-300 ease-in-out md:static md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Title Header with Close Button on Mobile */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            OrderDash
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-500 hover:bg-slate-100 w-8 h-8"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group border border-transparent",
                  isActive
                    ? "bg-violet-50 text-violet-600 border-violet-100/60 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                    isActive ? "text-violet-500" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
