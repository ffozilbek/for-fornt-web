import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { protectionStatsService } from "@/service/protection-stats.service";
import { LogQuery } from "@/types/dashboard";

export const useProtectionStats = (query: LogQuery) =>
  useQuery({
    queryKey: queryKeys.protectionStats(query),
    queryFn: () => protectionStatsService.getProtectionStats(query),
    placeholderData: keepPreviousData,
  });
