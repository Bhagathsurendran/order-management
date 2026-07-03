// api/orders.ts
// Order CRUD API calls with full TypeScript typing.

import apiClient from "@/lib/axios";
import {
  ApiResponse,
  CreateOrderForm,
  DashboardStats,
  Order,
  OrderListParams,
  OrderStatus,
  PaginatedResponse,
} from "@/types";

export const ordersApi = {
  // ── Create Order ────────────────────────────────────────────────────────
  create: async (form: CreateOrderForm) => {
    const { data } = await apiClient.post<ApiResponse<Order>>("/orders", form);
    return data;
  },

  // ── List Orders ─────────────────────────────────────────────────────────
  list: async (params: OrderListParams = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    if (params.search) query.set("search", params.search);
    if (params.status) query.set("status", params.status);
    if (params.sort_by) query.set("sort_by", params.sort_by);
    if (params.sort_order) query.set("sort_order", params.sort_order);
    if (params.date_from) query.set("date_from", params.date_from);
    if (params.date_to) query.set("date_to", params.date_to);

    const { data } = await apiClient.get<
      ApiResponse<PaginatedResponse<Order>>
    >(`/orders?${query.toString()}`);
    return data;
  },

  // ── Get Order Detail ────────────────────────────────────────────────────
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return data;
  },

  // ── Update Status ───────────────────────────────────────────────────────
  updateStatus: async (id: string, status: OrderStatus) => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(
      `/orders/${id}/status`,
      { status }
    );
    return data;
  },

  // ── Delete (soft) ───────────────────────────────────────────────────────
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<null>>(
      `/orders/${id}`
    );
    return data;
  },

  // ── Dashboard Stats ─────────────────────────────────────────────────────
  getStats: async () => {
    const { data } =
      await apiClient.get<ApiResponse<DashboardStats>>("/orders/stats");
    return data;
  },
};
