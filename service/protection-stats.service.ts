import { api } from "@/lib/api";
import { toLocalInput } from "@/lib/format";
import { customRange } from "@/lib/statistics";
import { LogQuery, protectionStatsResponseSchema } from "@/types/dashboard";

// backend soat (kasr) yoki start_date/end_date qabul qiladi
const toParams = (q: LogQuery): Record<string, string> => {
  const base = { zone_name: q.zone_name, service_name: q.service_name };
  if ("hours" in q) return { ...base, hours: String(q.hours) };
  const { start, end } = customRange(q, Date.now());
  return { ...base, start_date: toLocalInput(start), end_date: toLocalInput(end) };
};

export const protectionStatsService = {
  getProtectionStats: async (query: LogQuery) => {
    const { data } = await api.get("/api/protection-statistics", {
      params: toParams(query),
    });
    return protectionStatsResponseSchema.parse(data);
  },

  // fayl brauzer orqali yuklanadi; lang — hisobot tili
  exportUrl: (kind: "csv" | "pdf", query: LogQuery, lang: string) =>
    `/api/protection-statistics/export/${kind}?${new URLSearchParams({
      ...toParams(query),
      lang,
    })}`,
};
