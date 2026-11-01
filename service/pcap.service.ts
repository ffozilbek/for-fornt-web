import { api } from "@/lib/api";
import type { PcapKind, SizeUnit } from "@/lib/pcap";
import { pcapActionSchema, pcapFilesResponseSchema, pcapStatusSchema } from "@/types/dashboard";

export type PcapTarget = { zone_idx: number; service_idx: number; kind: PcapKind };
export type PcapStart = PcapTarget & {
  zone_name: string;
  service_name: string;
  max_size: number;
  size_unit: SizeUnit;
  auto_stop: boolean;
  max_files: number;
};

// C control socket javobi HTTP 200 bilan ham status: "error" bo'lishi mumkin
const ensureOk = (data: unknown) => {
  const r = pcapActionSchema.parse(data);
  if (r.status !== "ok") throw new Error(r.msg || "error");
  return r;
};

export const pcapService = {
  // C dasturi ishlamasa status: "error" + msg (zones bo'sh)
  getStatus: async () => {
    const { data } = await api.get("/api/pcap/status");
    return pcapStatusSchema.parse(data);
  },

  getFiles: async (params: Record<string, string>) => {
    const { data } = await api.get("/api/pcap/files", { params });
    const r = pcapFilesResponseSchema.parse(data);
    if (r.status !== "ok") throw new Error(r.msg || "error");
    return r.files;
  },

  start: async (body: PcapStart) => {
    const { data } = await api.post("/api/pcap/start", body);
    return ensureOk(data);
  },

  stop: async (body: PcapTarget) => {
    const { data } = await api.post("/api/pcap/stop", body);
    return ensureOk(data);
  },

  // yozilayotgan (RECORDING) faylni backend o'chirmaydi — avval Stop
  remove: async (filename: string) => {
    const { data } = await api.delete(`/api/pcap/delete/${encodeURIComponent(filename)}`);
    return ensureOk(data);
  },

  downloadUrl: (filename: string) => `/api/pcap/download/${encodeURIComponent(filename)}`,
};
