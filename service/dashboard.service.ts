import {
  AttackFilters,
  attackSummarySchema,
  systemResourcesSchema,
  summaryDetailSchema,
  DetailTarget,
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
};
