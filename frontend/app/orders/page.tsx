"use client";

// app/orders/page.tsx
// Orders list page with search, filter, sort, pagination, and create modal.

import { useState } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { OrderTable } from "@/components/OrderTable";
import { SearchFilter } from "@/components/SearchFilter";
import { Pagination } from "@/components/Pagination";
import { CreateOrderModal } from "@/components/CreateOrderModal";
import { Button } from "@/components/ui/button";
import { OrderListParams } from "@/types";
import { PlusCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { orderKeys } from "@/hooks/useOrders";

const DEFAULT_PARAMS: OrderListParams = {
  page: 1,
  page_size: 20,
  sort_by: "created_at",
  sort_order: "desc",
  search: "",
  status: "",
};

export default function OrdersPage() {
  const [params, setParams] = useState<OrderListParams>(DEFAULT_PARAMS);
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();
  const { isConnected } = useWebSocket(true);

  const { data, isLoading, isFetching } = useOrders(params);

  const orders = data?.data?.items ?? [];
  const total = data?.data?.total ?? 0;
  const totalPages = data?.data?.total_pages ?? 1;

  const updateParams = (updates: Partial<OrderListParams>) => {
    setParams((prev) => ({ ...prev, ...updates }));
  };

  const handleSort = (field: string) => {
    setParams((prev) => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === "desc" ? "asc" : "desc",
    }));
  };

  const handleReset = () => setParams(DEFAULT_PARAMS);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar wsConnected={isConnected} />

        <main className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
              <p className="text-slate-400 text-sm mt-1">
                {total > 0 ? `${total} orders total` : "No orders yet"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                New Order
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm shadow-slate-100/50">
            <SearchFilter
              params={params}
              onChange={updateParams}
              onReset={handleReset}
            />
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-slate-100/50">
            <OrderTable
              orders={orders}
              isLoading={isLoading}
              sortBy={params.sort_by}
              sortOrder={params.sort_order}
              onSort={handleSort}
            />
            <div className="px-4 border-t border-slate-100">
              <Pagination
                page={params.page ?? 1}
                totalPages={totalPages}
                total={total}
                pageSize={params.page_size ?? 20}
                onPageChange={(p) => updateParams({ page: p })}
              />
            </div>
          </div>
        </main>
      </div>

      <CreateOrderModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}
