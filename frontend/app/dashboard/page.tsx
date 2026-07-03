"use client";

// app/dashboard/page.tsx
// Dashboard showing KPI cards, pie chart, bar chart, and recent orders table.

import { useDashboardStats, useOrders } from "@/hooks/useOrders";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { DashboardCard } from "@/components/DashboardCard";
import { StatusPieChart, RevenueBarChart } from "@/components/Charts";
import { OrderTable } from "@/components/OrderTable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  DollarSign,
} from "lucide-react";
import { formatINR, formatUSD } from "@/lib/utils";

export default function DashboardPage() {
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: ordersData, isLoading: ordersLoading } = useOrders({
    page: 1,
    page_size: 5,
    sort_by: "created_at",
    sort_order: "desc",
  });
  const { isConnected } = useWebSocket(true);

  const stats = statsData?.data;
  const orders = ordersData?.data?.items ?? [];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar wsConnected={isConnected} />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
          </div>

          {/* KPI Cards */}
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 bg-white border border-slate-100 rounded-xl" />
              ))}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <DashboardCard
                label="Total Orders"
                value={stats.total_orders}
                icon={ShoppingCart}
                color="violet"
                className="col-span-1 sm:col-span-2 lg:col-span-1"
              />
              <DashboardCard
                label="Pending"
                value={stats.pending}
                icon={Clock}
                color="amber"
              />
              <DashboardCard
                label="Processing"
                value={stats.processing}
                icon={Loader2}
                color="blue"
              />
              <DashboardCard
                label="Completed"
                value={stats.completed}
                icon={CheckCircle2}
                color="emerald"
              />
              <DashboardCard
                label="Cancelled"
                value={stats.cancelled}
                icon={XCircle}
                color="red"
              />
              <DashboardCard
                label="Revenue (USD)"
                value={formatUSD(stats.total_revenue_usd)}
                icon={DollarSign}
                color="emerald"
                trend={`${formatINR(stats.total_revenue_inr)} INR`}
              />
            </div>
          ) : null}

          {/* Charts */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-100/50">
                <h2 className="text-sm font-bold text-slate-700 mb-4">
                  Order Status Distribution
                </h2>
                <StatusPieChart stats={stats} />
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-100/50">
                <h2 className="text-sm font-bold text-slate-700 mb-4">
                  Revenue Overview
                </h2>
                <RevenueBarChart stats={stats} />
              </div>
            </div>
          )}

          {/* Recent Orders */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm shadow-slate-100/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-700">
                Recent Orders
              </h2>
              <a
                href="/orders"
                className="text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                View all →
              </a>
            </div>
            <OrderTable
              orders={orders}
              isLoading={ordersLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
