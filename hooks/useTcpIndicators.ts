import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { LIVE_POINTS, type DomMode, type TcpHistoryRange, type TcpPoint } from "@/lib/tcp-indicators";
import { tcpIndicatorsService } from "@/service/tcp-indicators.service";

// har soniyada oxirgi qiymat olinib, so'nggi 60 soniyalik oyna yig'iladi.
// gcTime: 0 — tanlov o'zgarsa yoki tarixga o'tilsa eski oyna qolmaydi
export function useTcpLive(zone: string, service: string, enabled: boolean) {
  const queryClient = useQueryClient();
  const key = queryKeys.tcpIndicators.live(zone, service);

  return useQuery({
    queryKey: key,
    queryFn: async (): Promise<TcpPoint[]> => {
      const d = await tcpIndicatorsService.getLive(zone, service);
      const prev = queryClient.getQueryData<TcpPoint[]>(key) ?? [];
      return [...prev, { t: Date.now(), d }].slice(-LIVE_POINTS);
    },
    enabled,
    refetchInterval: 1000,
    gcTime: 0,
  });
}

export const useTcpHistory = (zone: string, service: string, range: TcpHistoryRange | null) =>
  useQuery({
    queryKey: queryKeys.tcpIndicators.history(zone, service, range),
    queryFn: () => tcpIndicatorsService.getHistory(zone, service, range!),
    enabled: range !== null,
    placeholderData: keepPreviousData,
  });

export const useTcpBaseline = (zone: string, service: string, mode: DomMode) =>
  useQuery({
    queryKey: queryKeys.tcpIndicators.baseline(zone, service, mode),
    queryFn: () => tcpIndicatorsService.getBaseline(zone, service, mode),
    enabled: mode !== "static",
    staleTime: 60_000,
  });
