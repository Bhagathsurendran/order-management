// hooks/useWebSocket.ts
// WebSocket hook for real-time order status updates.
// Automatically reconnects on disconnect with exponential backoff.
// Updates React Query cache when a status change is received.

"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WebSocketMessage } from "@/types";
import { orderKeys } from "./useOrders";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export function useWebSocket(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data);

        if (msg.type === "connected") return;
        if (msg.type === "pong") return;

        // Real order status update
        if (msg.id && msg.status && msg.updated_at) {
          // Invalidate the specific order detail
          queryClient.invalidateQueries({ queryKey: orderKeys.detail(msg.id) });
          // Invalidate all order lists and stats
          queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
          queryClient.invalidateQueries({ queryKey: orderKeys.stats() });

          toast.info(`Order #${msg.id.slice(0, 8).toUpperCase()} → ${msg.status}`, {
            description: "Order status updated in real-time",
            duration: 4000,
          });
        }
      } catch {
        // Ignore non-JSON messages
      }
    },
    [queryClient]
  );

  const connect = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;

    const ws = new WebSocket(`${WS_URL}/ws/orders`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttempts.current = 0;
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      wsRef.current = null;
      if (!enabled) return;

      // Exponential backoff reconnect
      const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000);
      reconnectAttempts.current++;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [enabled, handleMessage]);

  // Ping interval to keep connection alive
  useEffect(() => {
    if (!enabled) return;
    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 25000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [enabled, connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}
