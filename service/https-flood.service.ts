import { api } from "@/lib/api";
import {
  HttpsFloodHistoryQuery,
  httpsFloodHistorySchema,
  httpsFloodStatusSchema,
} from "@/types/dashboard";

export const httpsFloodService = {
  getStatus: async () => {
    const { data } = await api.get("/api/https-flood");
    return httpsFloodStatusSchema.parse(data);
  },

  getHistory: async (query: HttpsFloodHistoryQuery) => {
    const { data } = await api.get("/api/https-flood/history", {
      params: query,
    });
    return httpsFloodHistorySchema.parse(data);
  },
};
