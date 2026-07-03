"use client";

// app/orders/[id]/page.tsx
// Order detail page: shows all info + status update dropdown.

import { use } from "react";
import { useOrder, useUpdateOrderStatus } from "@/hooks/useOrders";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatINR, formatUSD, shortId } from "@/lib/utils";
import { OrderStatus } from "@/types";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Completed", "Cancelled"];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading } = useOrder(id);
  const updateStatus = useUpdateOrderStatus();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | "">("");

  const order = data?.data;

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !order) return;
    await updateStatus.mutateAsync({ id: order.id, status: selectedStatus });
    setSelectedStatus("");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
          {/* Back */}
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 bg-white border border-slate-100 rounded-xl" />
              ))}
            </div>
          ) : !order ? (
            <div className="text-center text-slate-400 py-20">
              <p className="text-lg">Order not found</p>
              <Link href="/orders" className="text-violet-600 text-sm mt-2 inline-block font-semibold">
                Return to orders
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">
                    Order #{shortId(order.id)}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">
                    Created {formatDate(order.created_at)}
                  </p>
                </div>
                <StatusBadge status={order.status} className="text-sm px-3 py-1.5" />
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Customer Name", value: order.customer_name },
                  { label: "Order ID", value: order.id, mono: true },
                  { label: "Amount (INR)", value: formatINR(order.amount) },
                  { label: "Amount (USD)", value: order.usd_amount ? formatUSD(order.usd_amount) : "—" },
                  { label: "Currency", value: order.currency },
                  { label: "Last Updated", value: formatDate(order.updated_at) },
                ].map(({ label, value, mono }) => (
                  <div
                    key={label}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm shadow-slate-100/50"
                  >
                    <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">
                      {label}
                    </p>
                    <p
                      className={`text-slate-700 font-medium ${
                        mono ? "font-mono text-xs text-slate-400" : ""
                      }`}
                    >
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Status Update */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-100/50">
                <h2 className="text-sm font-bold text-slate-700 mb-4">
                  Update Order Status
                </h2>
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedStatus}
                    onValueChange={(v) => setSelectedStatus(v as OrderStatus)}
                  >
                    <SelectTrigger className="w-48 bg-white border-slate-200 text-slate-700">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200">
                      {STATUSES.filter((s) => s !== order.status).map((s) => (
                        <SelectItem key={s} value={s} className="text-slate-700 focus:bg-slate-50">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!selectedStatus || updateStatus.isPending}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                  >
                    {updateStatus.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Update Status
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
