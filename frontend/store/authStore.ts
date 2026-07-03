// store/authStore.ts
// Zustand store for authentication state.
// Persists access/refresh tokens and user info in localStorage.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, accessToken, refreshToken) => {
        // Sync to localStorage for Axios interceptor
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
          document.cookie = `access_token=${accessToken}; path=/; max-age=${30 * 60}; SameSite=Lax`;
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
        }
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateTokens: (accessToken, refreshToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("refresh_token", refreshToken);
          document.cookie = `access_token=${accessToken}; path=/; max-age=${30 * 60}; SameSite=Lax`;
        }
        set({ accessToken, refreshToken });
      },
    }),
    {
      name: "order-auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
