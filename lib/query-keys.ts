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
    templates: ["dashboard", "mitigation-templates"] as const,
    templateList: (kind: string, template: string) =>
      ["dashboard", "mitigation-templates", "list", kind, template] as const,
    stats: ["dashboard", "stats"] as const,
    statsHistory: ["dashboard", "stats-history"] as const,
  },
  geo: {
    countries: ["geo", "countries"] as const,
    template: (template: string) => ["geo", "template", template] as const,
    templateSmart: (template: string) =>
      ["geo", "template-smart", template] as const,
  },
};
