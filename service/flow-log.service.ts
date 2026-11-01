import { api } from "@/lib/api";
import type { CaptureMode, FlowParams, GroupBy } from "@/lib/flow-log";
import {
  flowGroupResponseSchema,
  flowLogActionSchema,
  flowLogStatusSchema,
  flowMitigationResponseSchema,
  flowQueryResponseSchema,
  flowSeriesResponseSchema,
} from "@/types/dashboard";

export type CaptureTarget = { zone_idx: number; service_idx: number };
export type CaptureStart = CaptureTarget & { mode: CaptureMode; sample_rate: number };

// C control socket javobi HTTP 200 bilan ham status: "error" bo'lishi mumkin
const ensureOk = (data: unknown, ok = "ok") => {
  const r = flowLogActionSchema.parse(data);
  if (r.status !== ok) throw new Error(r.msg || "error");
  return r;
};

export const flowLogService = {
  // C dasturi ishlamasa status: "error" + msg keladi (slots bo'sh)
  getStatus: async () => {
    const { data } = await api.get("/api/flowlog/status");
    const r = flowLogStatusSchema.parse(data);
    return { slots: r.slots, error: r.status === "error" ? (r.msg ?? "error") : null };
  },

  start: async (body: CaptureStart) => {
    const { data } = await api.post("/api/flowlog/start", body);
    return ensureOk(data);
  },

  stop: async (body: CaptureTarget) => {
    const { data } = await api.post("/api/flowlog/stop", body);
    return ensureOk(data);
  },

  getRetention: async () => {
    const { data } = await api.get("/api/flowlog/retention");
    return ensureOk(data).days ?? 7;
  },

  setRetention: async (days: number) => {
    const { data } = await api.post("/api/flowlog/retention", { days });
    return ensureOk(data).days ?? days;
  },

  // joriy trafikni "normal" baseline sifatida saqlash (mitigation shunga solishtiradi)
  saveBaseline: async () => {
    const { data } = await api.post("/api/flowlog/baseline");
    return ensureOk(data, "success").baseline?.samples ?? 0;
  },

  getFlows: async (params: FlowParams) => {
    const { data } = await api.get("/api/flowlog/query", { params });
    return flowQueryResponseSchema.parse(data);
  },

  getGroups: async (params: FlowParams, by: GroupBy) => {
    const { data } = await api.get("/api/flowlog/group", { params: { ...params, by } });
    return flowGroupResponseSchema.parse(data);
  },

  getSeries: async (params: FlowParams, by: GroupBy, key: string) => {
    const { data } = await api.get("/api/flowlog/group/series", {
      params: { ...params, by, key },
    });
    return flowSeriesResponseSchema.parse(data);
  },

  getMitigation: async (params: FlowParams, by: GroupBy) => {
    const { data } = await api.get("/api/flowlog/mitigation", { params: { ...params, by } });
    return flowMitigationResponseSchema.parse(data);
  },

  // fayl brauzer orqali yuklanadi; by berilsa — guruhlangan ko'rinish
  exportUrl: (kind: "csv" | "pdf", params: FlowParams, lang: string) =>
    `/api/flowlog/export/${kind}?${new URLSearchParams({ ...params, lang })}`,
};
