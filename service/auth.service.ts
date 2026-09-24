import { api } from "@/lib/api";
import { AuthResponse, User } from "@/lib/types";

export const authService = {
  // LOGIN
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>("/api/auth/login", {
      username,
      password,
    });

    return data;
  },

  // LOGOUT
  logout: async (): Promise<{ status: string }> => {
    const { data } = await api.post<{ status: string }>("/api/auth/logout");
    return data;
  },

  // CHECK CURRENT SESSION
  getCurrentUser: async (): Promise<{ status: string; user: User }> => {
    const { data } = await api.get<{ status: string; user: User }>(
      "/api/auth/me",
    );
    return data;
  },
};
