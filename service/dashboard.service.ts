import {
  AttackFilters,
  attackSummarySchema,
  systemResourcesSchema,
  summaryDetailSchema,
  DetailTarget,
  zonesResponseSchema,
  servicesResponseSchema,
} from "@/types/dashboard";
import { api } from "@/lib/api";

export const dashboardService = {
  getSystemResources: async () => {
    const { data } = await api.get("/api/system-resources");
    return systemResourcesSchema.parse(data).data;
  },

  getAttackSummary: async ({ hours, zone }: AttackFilters) => {
    const { data } = await api.get("/api/dashboard/attack-summary", {
      params: { hours, zone_name: zone },
    });
    return attackSummarySchema.parse(data);
  },

  getDetail: async (
    { kind, key }: DetailTarget,
    { hours, zone }: AttackFilters,
  ) => {
    const { data } = await api.get("/api/dashboard/detail", {
      params: { kind, key, hours, zone_name: zone },
    });
    return summaryDetailSchema.parse(data);
  },

  getZones: async () => {
    const { data } = await api.get("/api/zones");
    return zonesResponseSchema.parse(data).zones;
  },

  getServices: async (zone: string) => {
    const { data } = await api.get("/api/services", { params: { zone } });
    return servicesResponseSchema.parse(data).services;
  },
};
