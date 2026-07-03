// api/auth.ts
// Authentication API calls: login, refresh, logout.

import apiClient from "@/lib/axios";
import { ApiResponse, User } from "@/types";

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export const authApi = {
  login: async (username: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      { username, password }
    );
    return data;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/refresh",
      { refresh_token: refreshToken }
    );
    return data;
  },

  logout: async (refreshToken: string) => {
    const { data } = await apiClient.post<ApiResponse<null>>("/auth/logout", {
      refresh_token: refreshToken,
    });
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
    return data;
  },
};
