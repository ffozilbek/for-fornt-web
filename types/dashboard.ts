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

// POST /zones javobi (add / edit / delete)
export const zoneMutationResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  message: z.string(),
});

export type ZoneSaveAction = "add" | "edit";
export type ZoneSavePayload = {
  action: ZoneSaveAction;
  zoneName: string;
  ips: string[];
};

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

// POST /api/services body (add / edit / delete)
export type ServiceSavePayload = {
  action: "add" | "edit";
  zoneName: string;
  serviceName: string;
  oldServiceName?: string;
  protocol: string;
  ports: string;
  protocolNumber: number;
  protectionProfile: string;
};

// GET /api/mitigation-templates — servisga biriktiriladigan himoya shablonlari.
// Himoya parametrlari (TEMPLATE_DEFAULTS dagi maydonlar) looseObject orqali
// o'tadi va formada valuesFromTemplate bilan o'qiladi.
export const mitigationTemplateSchema = z.looseObject({
  templateName: z.string(),
  templateType: z.string(),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  // to'g'ridan-to'g'ri + boshqa shablon ichida biriktirilgan zonalar
  attachedZones: z.array(z.string()).optional(),
  // ClickHouse UInt8 ustunlari 0/1 bo'lib kelishi mumkin
  basicTemplateEnable: z.union([z.boolean(), z.number()]).optional(),
});

export const mitigationTemplatesResponseSchema = z.object({
  templates: z.array(mitigationTemplateSchema),
});

export type MitigationTemplate = z.infer<typeof mitigationTemplateSchema>;

// /api/{whitelist,blacklist,ja4t,ja4,sni}/tpl/files — shablonga yuklangan
// fayllar. Son maydoni ro'yxat turiga qarab har xil nomlanadi.
export const templateListFileSchema = z.looseObject({
  filename: z.string(),
  upload_date: z.string().optional(),
  ip_count: z.number().optional(),
  subnet_count: z.number().optional(),
  ja4t_count: z.number().optional(),
  ja4_count: z.number().optional(),
  sni_count: z.number().optional(),
});

export const templateListFilesResponseSchema = z.object({
  files: z.array(templateListFileSchema),
});

// /tpl/ips (whitelist, blacklist) va /tpl/entries (ja4t, ja4, sni)
export const templateListCountResponseSchema = z.looseObject({
  count: z.number(),
});

export type TemplateListFile = z.infer<typeof templateListFileSchema>;

// GET /api/geo/countries
export const geoCountrySchema = z.object({
  code: z.string(),
  name: z.string().nullish(),
  ip_count: z.number().optional(),
});

export const geoCountriesResponseSchema = z.object({
  countries: z.array(geoCountrySchema),
});

export type GeoCountry = z.infer<typeof geoCountrySchema>;

const geoModeSchema = z.enum(["block", "allow"]).catch("block");

// GET /api/geo/tpl/config
export const templateGeoSchema = z.object({
  enabled: z.boolean(),
  mode: geoModeSchema,
  countries: z.array(z.string()),
});

// GET /api/geo/tpl/smart/config — vaqt oynali geo qoida (DB ustuni yo'q, json)
export const templateSmartGeoSchema = templateGeoSchema.extend({
  start: z.string(),
  end: z.string(),
});

export type TemplateGeo = z.infer<typeof templateGeoSchema>;
export type TemplateSmartGeo = z.infer<typeof templateSmartGeoSchema>;

// POST /api/mitigation-templates, PUT /api/mitigation-templates/<name> body.
// Backend faqat shu turga tegishli maydonlarni oladi, qolganini default qiladi.
export type MitigationTemplatePayload = {
  templateName: string;
  templateType: string;
} & Record<string, string | number | boolean>;

const protoCounter = z.object({ count: z.number(), bytes: z.number() });
const protoMap = z.object({
  TCP: protoCounter,
  UDP: protoCounter,
  ICMP: protoCounter,
  OTHER: protoCounter,
});

export const statsServiceSchema = z.looseObject({
  incoming_count: z.number(),
  incoming_bytes: z.number(),
  passed_count: z.number(),
  passed_bytes: z.number(),
  dropped_count: z.number(),
  dropped_bytes: z.number(),
  protocol: z.string().optional(),
  incoming_proto: protoMap.optional(),
  passed_proto: protoMap.optional(),
  dropped_proto: protoMap.optional(),
});

export const statsZoneSchema = z.looseObject({
  zone_name: z.string(),
  ip_address: z.string().optional(),
  worker_id: z.number().optional(),
  timestamp: z.number().optional(),
  total_incoming_packets: z.number(),
  total_incoming_bytes: z.number(),
  total_passed_packets: z.number(),
  total_passed_bytes: z.number(),
  total_dropped_packets: z.number(),
  total_dropped_bytes: z.number(),
  services: z.array(statsServiceSchema),
});

export const statsResponseSchema = z.object({
  status: z.literal("success"),
  zones: z.array(statsZoneSchema),
});

export type StatsZone = z.infer<typeof statsZoneSchema>;
export type StatsService = z.infer<typeof statsServiceSchema>;

export const filterRatioSchema = z.object({
  status: z.literal("success"),
  passed_packets: z.number(),
  dropped_packets: z.number(),
  passed_bytes: z.number(),
  dropped_bytes: z.number(),
});

export type FilterRatio = z.infer<typeof filterRatioSchema>;
export type FilterRatioParams = {
  hours: number;
  zone: string;
  service: string;
};
