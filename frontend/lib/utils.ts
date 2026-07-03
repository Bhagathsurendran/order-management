import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { OrderStatus } from "@/types";

/**
 * Merges Tailwind CSS class names with conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as Indian Rupee currency string.
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as USD currency string.
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string to a readable local date-time.
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

/**
 * Get Tailwind color classes for order status badges.
 */
export function getStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return map[status] ?? "bg-gray-500/20 text-gray-400 border-gray-500/30";
}

/**
 * Truncate a UUID string for display.
 */
export function shortId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}
