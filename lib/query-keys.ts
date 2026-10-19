import { AttackFilters, DetailTarget } from "@/types/dashboard";

export const queryKeys = {
  auth: { me: ["auth", "me"] as const },
  dashboard: {
    all: ["dashboard"] as const,
    resources: ["dashboard", "resources"] as const,
    attackSummary: (f: AttackFilters) =>
      ["dashboard", "attack-summary", f] as const,
    filterRatio: ["dashboard", "filter-ratio"] as const,
    detail: (t: DetailTarget, f: AttackFilters) =>
      ["dashboard", "detail", t.kind, t.key, f] as const,
  },
};
