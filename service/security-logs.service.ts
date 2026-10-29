import { api } from "@/lib/api";
import { LogQuery, securityLogsResponseSchema } from "@/types/dashboard";

const toParams = (q: LogQuery) =>
  Object.fromEntries(Object.entries(q).map(([k, v]) => [k, String(v)]));

// backendda "attacker logs" deb ataladi (antiddos_rate_limit_logs jadvali)
export const securityLogsService = {
  getLogs: async (query: LogQuery) => {
    const { data } = await api.get("/api/attacker-logs", {
      params: toParams(query),
    });
    return securityLogsResponseSchema.parse(data).logs;
  },

  // fayl brauzer orqali yuklanadi; lang — hisobot tili
  exportUrl: (kind: "csv" | "pdf", query: LogQuery, lang: string) =>
    `/api/attacker-logs/export/${kind}?${new URLSearchParams({ ...toParams(query), lang })}`,
};
