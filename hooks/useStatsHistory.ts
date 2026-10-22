import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/service/dashboard.service";
import type { StatsZone } from "@/types/dashboard";

const MAX_POINTS = 60; // ~1 daqiqa

export type StatsSnapshot = { t: number; zones: StatsZone[] };

export function useStatsHistory() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.dashboard.statsHistory,
    queryFn: async (): Promise<StatsSnapshot[]> => {
      const zones = await dashboardService.getStats();
      const prev =
        queryClient.getQueryData<StatsSnapshot[]>(
          queryKeys.dashboard.statsHistory,
        ) ?? [];
      return [...prev, { t: Date.now(), zones }].slice(-MAX_POINTS);
    },
    refetchInterval: 1000,
  });
}
