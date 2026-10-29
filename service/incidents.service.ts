import { api } from "@/lib/api";
import {
  activeIncidentsResponseSchema,
  historyIncidentsResponseSchema,
  IncidentHistoryQuery,
} from "@/types/dashboard";

const toParams = (q: IncidentHistoryQuery) =>
  Object.fromEntries(Object.entries(q).map(([k, v]) => [k, String(v)]));

export const incidentsService = {
  getActive: async () => {
    const { data } = await api.get("/api/incidents/active");
    return activeIncidentsResponseSchema.parse(data).incidents;
  },

  getHistory: async (query: IncidentHistoryQuery) => {
    const { data } = await api.get("/api/incidents/history", {
      params: toParams(query),
    });
    return historyIncidentsResponseSchema.parse(data).incidents;
  },

  // fayl brauzer orqali yuklanadi; lang — hisobot tili
  exportUrl: (kind: "csv" | "pdf", query: IncidentHistoryQuery, lang: string) =>
    `/api/incidents/history/export/${kind}?${new URLSearchParams({ ...toParams(query), lang })}`,
};
