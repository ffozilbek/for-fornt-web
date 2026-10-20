import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/service/dashboard.service";
import { AttackFilters, DetailTarget } from "@/types/dashboard";

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

export const useZones = () =>
  useQuery({
    queryKey: queryKeys.dashboard.zones,
    queryFn: dashboardService.getZones,
  });

export const useServices = (zone: string) =>
  useQuery({
    queryKey: queryKeys.dashboard.services(zone),
    queryFn: () => dashboardService.getServices(zone),
    enabled: zone !== "" && zone !== "all",
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });
