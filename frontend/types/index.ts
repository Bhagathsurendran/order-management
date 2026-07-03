// types/index.ts
// Shared TypeScript types and interfaces for the entire frontend

export type OrderStatus = "Pending" | "Processing" | "Completed" | "Cancelled";

export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user";
  created_at: string;
}

export interface Order {
  id: string;
  customer_name: string;
  amount: number;
  currency: string;
  usd_amount: number | null;
  status: OrderStatus;
  created_by: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface DashboardStats {
  total_orders: number;
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  total_revenue_inr: number;
  total_revenue_usd: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginForm {
  username: string;
  password: string;
}

export interface CreateOrderForm {
  customer_name: string;
  amount: number;
}

export interface WebSocketMessage {
  type?: string;
  id?: string;
  status?: OrderStatus;
  updated_at?: string;
  message?: string;
}

export interface OrderListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: OrderStatus | "";
  sort_by?: string;
  sort_order?: "asc" | "desc";
  date_from?: string;
  date_to?: string;
}
