// 1. Tizim resurslari modeli (/api/system-resources)
import { z } from "zod";

const memorySchema = z.object({
  total_mb: z.number(),
  used_mb: z.number(),
  free_mb: z.number(),
  usage_pct: z.number(),
});

export const systemResourcesSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    timestamp: z.number(),
    cpu: z.object({
      avg_pct: z.number(),
      nb_lcores: z.number(),
      lcores: z.array(
        z.object({
          lcore_id: z.number(),
          is_active: z.boolean(),
          utilization_pct: z.number(),
        }),
      ),
    }),
    ram: memorySchema,
    hugepages: memorySchema,
    disk: memorySchema,
    mempools: z.array(
      z.object({
        name: z.string(),
        size: z.number(),
        in_use: z.number(),
        usage_pct: z.number(),
      }),
    ),
  }),
});

// Tip sxemadan olinadi, ikkalasi bir-biridan ajralib ketmaydi
export type SystemResources = z.infer<typeof systemResourcesSchema>["data"];

// 2. Hujumlar statistikasi va Top 10 reytinglar (/api/dashboard/attack-summary)
export const attackSummarySchema = z.object({
  status: z.literal("success"),
  totals: z.object({
    incidents: z.number(),
    attackers: z.number(),
    dropped_packets: z.number(),
    dropped_bytes: z.number(),
  }),
  dropped: z.object({
    totals: z.object({ packets: z.number(), bytes: z.number() }),
    protocols: z.array(
      z.object({ name: z.string(), packets: z.number(), bytes: z.number() }),
    ),
    series: z.array(
      z.object({
        t: z.string(),
        total: z.number(),
        tcp: z.number(),
        udp: z.number(),
        icmp: z.number(),
        other: z.number(),
      }),
    ),
  }),
  top_indicator: z.object({
    name: z.string(),
    raw: z.string(),
    packets: z.number(),
    bytes: z.number(),
    share: z.number(),
    items: z.array(
      z.object({
        name: z.string(),
        raw: z.string(),
        packets: z.number(),
        bytes: z.number(),
      }),
    ),
  }),
  top_attackers: z.array(
    z.object({
      ip: z.string(),
      country: z.string(),
      country_code: z.string(),
      incidents: z.number(),
      packets: z.number(),
      bytes: z.number(),
      last_seen: z.string(),
    }),
  ),
  top_countries: z.array(
    z.object({
      country: z.string(),
      country_code: z.string(),
      attackers: z.number(),
      incidents: z.number(),
      packets: z.number(),
    }),
  ),
  attack_types: z.array(
    z.object({ type: z.string(), incidents: z.number(), packets: z.number() }),
  ),
  top_zones: z.array(
    z.object({ zone: z.string(), incidents: z.number(), packets: z.number() }),
  ),
});

export type AttackSummary = z.infer<typeof attackSummarySchema>;

export type AttackFilters = { hours: number; zone: string };

// 3. Filtrlash ulushi donut diagrammasi (/api/dashboard/filter-ratio)
export interface FilterRatioResponse {
  status: "success" | "error";
  passed_packets: number;
  dropped_packets: number;
  total_packets: number;
  drop_ratio_pct: number;
}

export interface ZoneItem {
  zoneName: string;
  ips: string[];
  ipSubnet: string;
}

export interface ServiceItem {
  serviceName: string;
  protocol: string;
  protocolNumber?: number;
}

export const SUMMARY_KEYS = [
  "incidents",
  "attackers",
  "blocked",
  "indicators",
] as const;
export type SummaryKey = (typeof SUMMARY_KEYS)[number];

export const summaryDetailSchema = z.object({
  status: z.literal("success"),
  found: z.boolean(),
  header: z.object({
    key: z.string(),
    kind: z.string(),
    title: z.string(),
    country_code: z.string().optional(),
    subtitle: z.string().optional(),
  }),
  totals: z.object({
    incidents: z.number(),
    attackers: z.number(),
    dropped_packets: z.number(),
    dropped_bytes: z.number(),
    peak_pps: z.number(),
    peak_bps: z.number(),
    first_seen: z.string().nullable(),
    last_seen: z.string().nullable(),
  }),
  breakdowns: z.array(
    z.object({
      label: z.string(),
      items: z.array(
        z.looseObject({
          name: z.string(),
          incidents: z.number(),
          packets: z.number(),
          bytes: z.number().optional(),
        }),
      ),
    }),
  ),
  incidents: z.array(
    z.object({
      ip: z.string(),
      zone: z.string(),
      service: z.string(),
      type: z.string(),
      start: z.string(),
      finish: z.string(),
      duration: z.number(),
      packets: z.number(),
      bytes: z.number(),
      avg_pps: z.number(),
    }),
  ),
  charts: z
    .object({
      protocols: z
        .array(
          z.object({
            name: z.string(),
            packets: z.number(),
            bytes: z.number(),
          }),
        )
        .optional(),
      series: z
        .array(
          z.object({
            t: z.string(),
            total: z.number().optional(),
            tcp: z.number().optional(),
            udp: z.number().optional(),
            icmp: z.number().optional(),
            other: z.number().optional(),
          }),
        )
        .optional(),
      indicators: z.array(z.any()).optional(),
    })
    .optional(),
});

export type SummaryDetail = z.infer<typeof summaryDetailSchema>;

export const DETAIL_KINDS = [
  "summary",
  "attacker",
  "country",
  "attack-type",
  "zone",
] as const;
export type DetailKind = (typeof DETAIL_KINDS)[number];

export type DetailTarget =
  | { kind: "summary"; key: SummaryKey }
  | { kind: Exclude<DetailKind, "summary">; key: string };

export const zoneSchema = z.object({
  zoneName: z.string(),
  ipSubnet: z.string(),
  ips: z.array(z.string()),
  createDate: z.string(),
  updatedAt: z.string(),
});

export const zonesResponseSchema = z.object({
  zones: z.array(zoneSchema),
});

export type Zone = z.infer<typeof zoneSchema>;
export type ZonesResponse = z.infer<typeof zonesResponseSchema>;

export const serviceSchema = z.object({
  serviceName: z.string(),
  zoneName: z.string(),
  protocol: z.string(),
  protocolNumber: z.number(),
  ports: z.string(),
  action: z.string(),
  protectionProfile: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const servicesResponseSchema = z.object({
  services: z.array(serviceSchema),
});

export type Service = z.infer<typeof serviceSchema>;
