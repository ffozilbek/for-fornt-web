import { api } from "@/lib/api";
import { toLocalInput } from "@/lib/format";
import { customRange, presetMinutes, queryRange } from "@/lib/statistics";
import { LogQuery, statisticsResponseSchema } from "@/types/dashboard";

// backend daqiqa kutadi; filtr paneli esa soat (kasr) bilan ishlaydi
const toParams = (q: LogQuery, now: number): Record<string, string> => {
  const base = { zone_name: q.zone_name, service_name: q.service_name };
  if ("hours" in q) return { ...base, minutes: String(presetMinutes(q.hours)) };
  const { start, end } = customRange(q, now);
  return { ...base, start_date: toLocalInput(start), end_date: toLocalInput(end) };
};

export const statisticsService = {
  // range — so'rov yuborilgan paytdagi oraliq: grafik nuqtalari shunga quriladi
  getStatistics: async (query: LogQuery) => {
    const now = Date.now();
    const { data } = await api.get("/api/statistics", {
      params: toParams(query, now),
    });
    return { ...statisticsResponseSchema.parse(data), range: queryRange(query, now) };
  },

  // fayl brauzer orqali yuklanadi; svc_proto — CSV/PDF ustunlarini servis
  // protokoli bilan cheklash uchun, lang — hisobot tili
  exportUrl: (kind: "csv" | "pdf", query: LogQuery, svcProto: string, lang: string) =>
    `/api/statistics/export/${kind}?${new URLSearchParams({
      ...toParams(query, Date.now()),
      svc_proto: svcProto,
      lang,
    })}`,
};
