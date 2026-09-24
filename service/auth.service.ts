import { apiFetch } from "@/lib/api";
import { AuthResponse, User } from "@/lib/types";

export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    return apiFetch<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  logout: async (): Promise<{ status: string }> => {
    return apiFetch<{ status: string }>("/api/auth/logout", {
      method: "POST",
    });
  },

  getCurrentUser: async (): Promise<{ status: string; user: User }> => {
    return apiFetch<{ status: string; user: User }>("/api/auth/me", {
      method: "GET",
    });
  },
};
