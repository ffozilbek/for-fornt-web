import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/service/dashboard.service";
import { AttackFilters, DetailTarget, SummaryKey } from "@/types/dashboard";

export const useSystemResources = () =>
  useQuery({
    queryKey: queryKeys.dashboard.resources,
    queryFn: dashboardService.getSystemResources,
    refetchInterval: 2000,
  });

export const useAttackSummary = (filters: AttackFilters) =>
  useQuery({
    queryKey: queryKeys.dashboard.attackSummary(filters),
    queryFn: () => dashboardService.getAttackSummary(filters),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

export const useDetail = (target: DetailTarget, filters: AttackFilters) =>
  useQuery({
    queryKey: queryKeys.dashboard.detail(target, filters),
    queryFn: () => dashboardService.getDetail(target, filters),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });
