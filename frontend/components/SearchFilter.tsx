"use client";

// components/SearchFilter.tsx
// Search input + status and sort filter controls for the orders page.

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderListParams, OrderStatus } from "@/types";
import { Search, X } from "lucide-react";

interface SearchFilterProps {
  params: OrderListParams;
  onChange: (updates: Partial<OrderListParams>) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "Pending", label: "Pending" },
  { value: "Processing", label: "Processing" },
  { value: "Completed", label: "Completed" },
  { value: "Cancelled", label: "Cancelled" },
];

export function SearchFilter({ params, onChange, onReset }: SearchFilterProps) {
  const hasFilters = !!params.search || !!params.status;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search customer..."
          value={params.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value, page: 1 })}
          className="pl-9 bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10"
        />
      </div>

      {/* Status Filter */}
      <Select
        value={params.status ?? ""}
        onValueChange={(val: string | null) => {
          const status = !val || val === "__all__" ? "" : val;
          onChange({ status: status as OrderStatus | "", page: 1 });
        }}
      >
        <SelectTrigger className="w-40 bg-white border-slate-200 text-slate-700">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200">
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value || "__all__"}
              className="text-slate-700 focus:bg-slate-50 focus:text-slate-900"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort */}
      <Select
        value={`${params.sort_by ?? "created_at"}:${params.sort_order ?? "desc"}`}
        onValueChange={(val) => {
          if (!val) return;
          const [sort_by, sort_order] = val.split(":");
          onChange({ sort_by, sort_order: sort_order as "asc" | "desc" });
        }}
      >
        <SelectTrigger className="w-44 bg-white border-slate-200 text-slate-700">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white border-slate-200">
          {[
            { value: "created_at:desc", label: "Newest First" },
            { value: "created_at:asc", label: "Oldest First" },
            { value: "amount:desc", label: "Highest Amount" },
            { value: "amount:asc", label: "Lowest Amount" },
            { value: "customer_name:asc", label: "Customer A–Z" },
          ].map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-slate-700 focus:bg-slate-50 focus:text-slate-900"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Reset */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 gap-1.5"
        >
          <X className="w-3.5 h-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
