import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { httpsFloodService } from "@/service/https-flood.service";
import { HttpsFloodHistoryQuery } from "@/types/dashboard";

// detektor holati backendda har 2 soniyada yangilanadi
export const useHttpsFloodStatus = () =>
  useQuery({
    queryKey: queryKeys.httpsFlood.status,
    queryFn: httpsFloodService.getStatus,
    refetchInterval: 2000,
  });

export const useHttpsFloodHistory = (query: HttpsFloodHistoryQuery) =>
  useQuery({
    queryKey: queryKeys.httpsFlood.history(query),
    queryFn: () => httpsFloodService.getHistory(query),
    refetchInterval: 8000,
    placeholderData: keepPreviousData,
  });
