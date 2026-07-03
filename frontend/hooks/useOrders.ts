// hooks/useOrders.ts
// React Query hooks for all order-related data fetching and mutations.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ordersApi } from "@/api/orders";
import { OrderListParams, OrderStatus } from "@/types";

// ── Query Keys ──────────────────────────────────────────────────────────────
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (params: OrderListParams) => [...orderKeys.lists(), params] as const,
  details: () => [...orderKeys.all, "detail"] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, "stats"] as const,
};

// ── Hooks ───────────────────────────────────────────────────────────────────
export function useOrders(params: OrderListParams = {}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => ordersApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => ordersApi.getById(id),
    enabled: !!id,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: ordersApi.getStats,
    refetchInterval: 30000, // Auto-refresh every 30s
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      toast.success(data.message || "Order created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create order");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      toast.success(data.message || "Status updated");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update status");
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() });
      toast.success("Order deleted");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete order");
    },
  });
}
