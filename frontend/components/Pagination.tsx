"use client";

// components/Pagination.tsx
// Pagination controls: previous/next + page number buttons.

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  return (
    <div className="flex items-center justify-between py-4">
      <p className="text-sm text-slate-500">
        Showing{" "}
        <span className="font-medium text-slate-900">
          {start}–{end}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-900">{total}</span> orders
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 w-8 text-slate-400 hover:text-slate-900 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            variant="ghost"
            size="icon"
            onClick={() => onPageChange(p)}
            className={cn(
              "h-8 w-8 text-sm",
              p === page
                ? "text-violet-600 font-bold border border-violet-500/40"
                : "text-slate-400 hover:text-slate-900"
            )}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 w-8 text-slate-400 hover:text-slate-900 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
