import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { pcapService } from "@/service/pcap.service";

// yozuv davomida joriy hajm / part va yangi fayllar ko'rinib turishi uchun 3s
const POLL = 3000;

export const usePcapStatus = () =>
  useQuery({
    queryKey: queryKeys.pcap.status,
    queryFn: pcapService.getStatus,
    refetchInterval: POLL,
  });

export const usePcapFiles = (params: Record<string, string>) =>
  useQuery({
    queryKey: queryKeys.pcap.files(params),
    queryFn: () => pcapService.getFiles(params),
    refetchInterval: POLL,
    placeholderData: keepPreviousData,
  });

// start/stop/delete'dan keyin holat va fayllar darhol yangilanadi
const usePcapMutation = <T, R>(fn: (v: T) => Promise<R>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.pcap.all }),
  });
};

export const useStartPcap = () => usePcapMutation(pcapService.start);
export const useStopPcap = () => usePcapMutation(pcapService.stop);
export const useDeletePcap = () => usePcapMutation(pcapService.remove);
