"use client";

// components/Navbar.tsx
// Top navigation bar with user info, theme toggle, real-time WS indicator, and logout.

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { useUIStore } from "@/store/uiStore";
import { LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  wsConnected?: boolean;
}

export function Navbar({ wsConnected = false }: NavbarProps) {
  const { user, refreshToken, logout } = useAuthStore();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // Proceed even if API fails
    }
    logout();
    router.push("/login");
    toast.success("Logged out successfully");
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-slate-200 bg-white">
      {/* Left: Mobile Toggle & Page title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="md:hidden text-slate-500 hover:bg-slate-100 w-9 h-9"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <span className="text-base md:text-lg font-semibold text-slate-800">
          Order Management
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <User className="w-3 h-3 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xs font-semibold text-slate-700">
              {user?.username ?? "User"}
            </span>
            <span className="text-[10px] text-slate-400 capitalize">
              {user?.role ?? "user"}
            </span>
          </div>
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-slate-500 hover:text-red-600 hover:bg-red-50 w-9 h-9"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
