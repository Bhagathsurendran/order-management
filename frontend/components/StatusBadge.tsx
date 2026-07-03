"use client";

// components/StatusBadge.tsx
// Colored badge component for displaying order status with icons.

import { cn, getStatusColor } from "@/lib/utils";
import { OrderStatus } from "@/types";
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

const statusIcons: Record<OrderStatus, React.ReactNode> = {
  Pending: <Clock className="w-3 h-3" />,
  Processing: <Loader2 className="w-3 h-3 animate-spin" />,
  Completed: <CheckCircle2 className="w-3 h-3" />,
  Cancelled: <XCircle className="w-3 h-3" />,
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        getStatusColor(status),
        className
      )}
    >
      {statusIcons[status]}
      {status}
    </span>
  );
}
