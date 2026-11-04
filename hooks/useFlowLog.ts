import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import type { FlowParams, GroupBy } from "@/lib/flow-log";
import { flowLogService } from "@/service/flow-log.service";

// yozuv holati 5 soniyada yangilanadi; jadval esa faqat so'ralganda
// (filtr / Refresh), aks holda sahifalash foydalanuvchi ostida o'zgarib ketadi
export const useFlowLogStatus = () =>
  useQuery({
    queryKey: queryKeys.flowLog.status,
    queryFn: flowLogService.getStatus,
    refetchInterval: 5000,
  });

const useCaptureMutation = <T>(fn: (v: T) => Promise<unknown>) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.flowLog.status }),
  });
};

export const useStartCapture = () => useCaptureMutation(flowLogService.start);
export const useStopCapture = () => useCaptureMutation(flowLogService.stop);

export const useFlowLogRetention = () =>
  useQuery({
    queryKey: queryKeys.flowLog.retention,
    queryFn: flowLogService.getRetention,
  });

export const useSetRetention = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: flowLogService.setRetention,
    onSuccess: (days) => qc.setQueryData(queryKeys.flowLog.retention, days),
  });
};

export const useSaveFlowBaseline = () => useMutation({ mutationFn: flowLogService.saveBaseline });

export const useFlowRows = (params: FlowParams, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.flowLog.flows(params),
    queryFn: () => flowLogService.getFlows(params),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useFlowGroups = (params: FlowParams, by: GroupBy | "", enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.flowLog.groups(params, by),
    queryFn: () => flowLogService.getGroups(params, by as GroupBy),
    enabled: enabled && by !== "",
    placeholderData: keepPreviousData,
  });

export const useFlowMitigation = (params: FlowParams, by: GroupBy, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.flowLog.mitigation(params, by),
    queryFn: () => flowLogService.getMitigation(params, by),
    enabled,
    placeholderData: keepPreviousData,
  });

export const useFlowSeries = (params: FlowParams, by: GroupBy, key: string | null) =>
  useQuery({
    queryKey: queryKeys.flowLog.series(params, by, key ?? ""),
    queryFn: () => flowLogService.getSeries(params, by, key!),
    enabled: key !== null,
  });
