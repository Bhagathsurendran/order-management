"use client";

// app/providers.tsx
// Client-side providers: React Query, Sonner toasts.

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        theme="dark"
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: "#111827",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
          },
        }}
      />
    </QueryClientProvider>
  );
}
