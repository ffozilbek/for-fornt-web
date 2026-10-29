import { api } from "@/lib/api";
import { auditLogsResponseSchema, LogQuery } from "@/types/dashboard";

const toParams = (q: LogQuery) =>
  Object.fromEntries(Object.entries(q).map(([k, v]) => [k, String(v)]));

// konfiguratsiya o'zgarishlari (antiddos_config_logs jadvali)
export const auditLogsService = {
  getLogs: async (query: LogQuery) => {
    const { data } = await api.get("/api/audit-logs", {
      params: toParams(query),
    });
    return auditLogsResponseSchema.parse(data).logs;
  },

  // fayl brauzer orqali yuklanadi; lang — hisobot tili
  exportUrl: (kind: "csv" | "pdf", query: LogQuery, lang: string) =>
    `/api/audit-logs/export/${kind}?${new URLSearchParams({ ...toParams(query), lang })}`,
};
