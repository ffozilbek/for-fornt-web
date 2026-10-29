import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { statisticsService } from "@/service/statistics.service";
import { LogQuery } from "@/types/dashboard";

export const useStatistics = (query: LogQuery) =>
  useQuery({
    queryKey: queryKeys.statistics(query),
    queryFn: () => statisticsService.getStatistics(query),
    placeholderData: keepPreviousData,
  });
