import { api } from "@/lib/api";
import { AuthResponse, ChangePasswordPayload, meResponseSchema } from "@/types/auth";

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
  getCurrentUser: async () => {
    const { data } = await api.get("/api/auth/me");
    return meResponseSchema.parse(data);
  },

  // faqat superadmin; boshqalarga backend 403 qaytaradi
  changePassword: async (body: ChangePasswordPayload) => {
    const { data } = await api.post<{ message?: string }>("/api/auth/change-password", body);
    return data;
  },
};
