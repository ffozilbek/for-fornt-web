import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/service/dashboard.service";
import { AttackFilters } from "@/types/dashboard";

export const useSystemResources = () =>
  useQuery({
    queryKey: queryKeys.dashboard.resources,
    queryFn: dashboardService.getSystemResources,
    refetchInterval: 2000, // har 1 soniyada yangilanadi, setInterval kerak emas
  });

export const useAttackSummary = (filters: AttackFilters) =>
  useQuery({
    queryKey: queryKeys.dashboard.attackSummary(filters),
    queryFn: () => dashboardService.getAttackSummary(filters),
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });
