import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { incidentsService } from "@/service/incidents.service";
import { IncidentHistoryQuery } from "@/types/dashboard";

// backend faol hujumlarni har 2 soniyada yig'adi; sidebar badge ham shu keshni ishlatadi
export const useActiveIncidents = () =>
  useQuery({
    queryKey: queryKeys.incidents.active,
    queryFn: incidentsService.getActive,
    refetchInterval: 2000,
  });

export const useIncidentHistory = (query: IncidentHistoryQuery) =>
  useQuery({
    queryKey: queryKeys.incidents.history(query),
    queryFn: () => incidentsService.getHistory(query),
    placeholderData: keepPreviousData,
  });
