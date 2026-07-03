"use client";

// components/DashboardCard.tsx
// KPI stat card for dashboard with icon, label, value, and animated gradient.

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: "violet" | "amber" | "blue" | "emerald" | "red";
  trend?: string;
  className?: string;
}

const colorMap = {
  violet: {
    bg: "bg-white",
    icon: "bg-violet-50 text-violet-600 border border-violet-100/50",
    border: "border-slate-200",
    glow: "shadow-sm shadow-slate-100",
  },
  amber: {
    bg: "bg-white",
    icon: "bg-amber-50 text-amber-600 border border-amber-100/50",
    border: "border-slate-200",
    glow: "shadow-sm shadow-slate-100",
  },
  blue: {
    bg: "bg-white",
    icon: "bg-blue-50 text-blue-600 border border-blue-100/50",
    border: "border-slate-200",
    glow: "shadow-sm shadow-slate-100",
  },
  emerald: {
    bg: "bg-white",
    icon: "bg-emerald-50 text-emerald-600 border border-emerald-100/50",
    border: "border-slate-200",
    glow: "shadow-sm shadow-slate-100",
  },
  red: {
    bg: "bg-white",
    icon: "bg-red-50 text-red-600 border border-red-100/50",
    border: "border-slate-200",
    glow: "shadow-sm shadow-slate-100",
  },
};

export function DashboardCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  className,
}: DashboardCardProps) {
  const colors = colorMap[color];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-default",
        colors.bg,
        colors.border,
        colors.glow,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            {label}
          </p>
          <p className="text-3xl font-bold text-slate-800 tracking-tight">{value}</p>
          {trend && (
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{trend}</p>
          )}
        </div>
        <div className={cn("p-2.5 rounded-xl flex items-center justify-center", colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
