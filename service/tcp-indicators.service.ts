import { api } from "@/lib/api";
import type { TcpHistoryRange, TcpPoint } from "@/lib/tcp-indicators";
import {
  tcpBaselineResponseSchema,
  tcpHistoryResponseSchema,
  tcpLiveResponseSchema,
} from "@/types/dashboard";

export const tcpIndicatorsService = {
  getLive: async (zone: string, service: string) => {
    const { data } = await api.get("/api/tcp-indicators", { params: { zone, service } });
    return tcpLiveResponseSchema.parse(data).data;
  },

  // nuqtalar ustunli javobdan [{t, d}] ko'rinishiga keltiriladi
  getHistory: async (zone: string, service: string, range: TcpHistoryRange) => {
    const { data } = await api.get("/api/tcp-indicators/history", {
      params: { zone, service, ...range },
    });
    const { bucket_sec, times, series } = tcpHistoryResponseSchema.parse(data);
    const fields = Object.keys(series);
    const points: TcpPoint[] = times.map((ts, i) => ({
      t: ts * 1000,
      d: Object.fromEntries(fields.map((f) => [f, series[f][i] ?? 0])),
    }));
    return { points, bucketSec: bucket_sec };
  },

  getBaseline: async (zone: string, service: string, window: string) => {
    const { data } = await api.get("/api/tcp-indicators/baseline", {
      params: { zone, service, window },
    });
    return tcpBaselineResponseSchema.parse(data);
  },
};
