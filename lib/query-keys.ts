import {
  AttackFilters,
  DetailTarget,
  FilterRatioParams,
} from "@/types/dashboard";

export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  dashboard: {
    all: ["dashboard"] as const,
    resources: ["dashboard", "resources"] as const,
    attackSummary: (f: AttackFilters) =>
      ["dashboard", "attack-summary", f] as const,
    filterRatio: (p: FilterRatioParams) =>
      ["dashboard", "filter-ratio", p] as const,
    detail: (t: DetailTarget, f: AttackFilters) =>
      ["dashboard", "detail", t.kind, t.key, f] as const,
    zones: ["dashboard", "zones"] as const,
    services: (zone: string) => ["dashboard", "services", zone] as const,
    stats: ["dashboard", "stats"] as const,
    statsHistory: ["dashboard", "stats-history"] as const,
  },
};
