"use client";

// components/OrderTable.tsx
// Sortable, paginated order table with status badges, actions, and skeleton loading.

import { Order, OrderStatus } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatINR, formatUSD, shortId } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Skeleton,
} from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, RefreshCw, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUpdateOrderStatus } from "@/hooks/useOrders";

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Completed", "Cancelled"];

interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSort?: (field: string) => void;
}

function SortIcon({ field, sortBy, sortOrder }: { field: string; sortBy?: string; sortOrder?: string }) {
  if (sortBy !== field) return null;
  return sortOrder === "asc" ? (
    <ChevronUp className="w-3 h-3 inline ml-1" />
  ) : (
    <ChevronDown className="w-3 h-3 inline ml-1" />
  );
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i} className="border-slate-100">
          {Array.from({ length: 7 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full bg-slate-100 rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function OrderTable({
  orders,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
}: OrderTableProps) {
  const updateStatus = useUpdateOrderStatus();
  const router = useRouter();

  const handleSort = (field: string) => {
    if (onSort) onSort(field);
  };

  return (
    <div className="rounded-xl border border-slate-200 overflow-x-auto bg-white">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 hover:bg-transparent">
            {[
              { label: "Order ID", field: "id" },
              { label: "Customer", field: "customer_name" },
              { label: "Amount (INR)", field: "amount" },
              { label: "USD Amount", field: "usd_amount" },
              { label: "Status", field: "status" },
              { label: "Created", field: "created_at" },
              { label: "Actions", field: "" },
            ].map(({ label, field }) => (
              <TableHead
                key={label}
                onClick={() => field && handleSort(field)}
                className={`text-slate-400 text-xs font-semibold uppercase tracking-wider ${
                  field ? "cursor-pointer hover:text-slate-800 transition-colors" : ""
                }`}
              >
                {label}
                {field && <SortIcon field={field} sortBy={sortBy} sortOrder={sortOrder} />}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            <TableSkeleton />
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-slate-400 py-12"
              >
                No orders found. Create your first order!
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow
                key={order.id}
                className="border-slate-100 hover:bg-slate-50/50 transition-colors"
              >
                <TableCell className="font-mono text-xs text-slate-500">
                  #{shortId(order.id)}
                </TableCell>
                <TableCell className="font-semibold text-slate-800">
                  {order.customer_name}
                </TableCell>
                <TableCell className="text-slate-700 font-medium">
                  {formatINR(order.amount)}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {order.usd_amount ? formatUSD(order.usd_amount) : (
                    <span className="text-slate-300 italic">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-slate-400 text-xs">
                  {formatDate(order.created_at)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-white border-slate-200 text-slate-700 shadow-md"
                    >
                      <DropdownMenuItem
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="flex items-center gap-2 py-2.5 cursor-pointer focus:bg-slate-50 focus:text-slate-900"
                      >
                        <Eye className="w-4 h-4 text-slate-500" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-100" />
                      {STATUSES.filter((s) => s !== order.status).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() =>
                            updateStatus.mutate({ id: order.id, status })
                          }
                          className="flex items-center gap-2 py-2.5 cursor-pointer focus:bg-slate-50 focus:text-slate-900"
                          disabled={updateStatus.isPending}
                        >
                          <RefreshCw className="w-3 h-3 text-slate-500" />
                          Set {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
