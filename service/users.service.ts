import { api } from "@/lib/api";
import { UserSavePayload, usersResponseSchema } from "@/types/auth";

// /api/users/* — faqat superadmin
export const usersService = {
  list: async () => {
    const { data } = await api.get("/api/users");
    return usersResponseSchema.parse(data).users;
  },

  // original bo'lsa — tahrir (PUT), aks holda yangi (POST)
  save: async ({ original, ...body }: UserSavePayload) => {
    const { data } = original
      ? await api.put(`/api/users/${encodeURIComponent(original)}`, body)
      : await api.post("/api/users", body);
    return data as { message?: string };
  },

  remove: async (username: string) => {
    const { data } = await api.delete(`/api/users/${encodeURIComponent(username)}`);
    return data as { message?: string };
  },
};
