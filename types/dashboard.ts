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

// GET /api/https-flood — TLS/443 flood detektori holati (C data plane shm,
// har soniyada yangilanadi). available=false bo'lsa l2fwd ishlamayapti.
export const HTTPS_FLOOD_STATES = { learning: 0, detecting: 1, attack: 2 } as const;

export const httpsFloodServiceSchema = z.looseObject({
  zone_name: z.string(),
  zone_ip: z.string(),
  service_name: z.string(),
  // 0 = Learning, 1 = Learn&Detect, 2 = Mitigation
  state: z.number(),
  state_name: z.string(),
  stale: z.boolean(),
  age_sec: z.number(),
  learn_reqs: z.number(),
  learn_target: z.number(),
  learn_progress: z.number(),
  rps: z.number(),
  u_long: z.number(),
  u_short: z.number(),
  threshold: z.number(),
  bl_long: z.number(),
  bl_short: z.number(),
  rv_now: z.number(),
  rv_base: z.number(),
  rv_trigger: z.number(),
  rate_anom: z.boolean(),
  rv_anom: z.boolean(),
  consec_anom: z.number(),
  sustain_target: z.number(),
  consec_quiet: z.number(),
  quiet_target: z.number(),
  suspects: z.number(),
  suspect_list: z.array(z.object({ ip: z.string(), rps: z.number() })),
  attack_duration: z.number(),
});

export const httpsFloodStatusSchema = z.looseObject({
  available: z.boolean(),
  reason: z.string().optional(),
  services: z.array(httpsFloodServiceSchema),
  summary: z.object({
    total: z.number(),
    learning: z.number(),
    detecting: z.number(),
    under_attack: z.number(),
    suspects: z.number(),
  }),
});

export type HttpsFloodService = z.infer<typeof httpsFloodServiceSchema>;
export type HttpsFloodStatus = z.infer<typeof httpsFloodStatusSchema>;

// GET /api/https-flood/history — attackers_report dagi HTTPS_FLOOD_SUSPECT
export const httpsFloodAttackSchema = z.looseObject({
  src_ip: z.string(),
  zone_name: z.string(),
  service_name: z.string(),
  suspect_requests: z.number(),
  avg_rps: z.number(),
  started: z.string(),
  finished: z.string(),
  duration: z.number(),
});

export const httpsFloodHistorySchema = z.looseObject({
  available: z.boolean(),
  reason: z.string().optional(),
  count: z.number(),
  distinct_ips: z.number(),
  attacks: z.array(httpsFloodAttackSchema),
});

export type HttpsFloodAttack = z.infer<typeof httpsFloodAttackSchema>;

// oxirgi N soat yoki maxsus oraliq (datetime-local qiymatlari)
export type HttpsFloodHistoryQuery =
  | { hours: number }
  | { start_date: string; end_date: string };

// /api/incidents/* — servis protokoli/porti chiroyli ko'rsatish uchun keladi
const incidentServiceFields = {
  service_name: z.string().nullish(),
  service_protocol: z.string().nullish(),
  service_ports: z.string().nullish(),
  service_protocol_number: z.number().nullish(),
};

// GET /api/incidents/active — oxirgi 8 soniyada yangilangan hujumlar
export const activeIncidentSchema = z.looseObject({
  src_ip: z.string(),
  dst_ip: z.string(),
  attack_type: z.string(),
  zona_name: z.string(),
  ...incidentServiceFields,
  dropped_count: z.number(),
  dropped_bytes: z.number(),
  start_time: z.string(),
  duration: z.number(),
  avg_pps: z.number(),
  avg_bps: z.number(),
});

export const activeIncidentsResponseSchema = z.object({
  incidents: z.array(activeIncidentSchema),
});

// GET /api/incidents/history — attackers_report (ko'pi bilan 1000 ta)
export const historyIncidentSchema = z.looseObject({
  zona_name: z.string(),
  zona_ip: z.string(),
  ...incidentServiceFields,
  attacker_ip: z.string(),
  attacker_type: z.string(),
  dropped_count: z.number(),
  dropped_byte: z.number(),
  avg_pps: z.number(),
  avg_bps: z.number(),
  start_time: z.string(),
  finish_time: z.string(),
  duration: z.number(),
});

export const historyIncidentsResponseSchema = z.object({
  incidents: z.array(historyIncidentSchema),
});

export type ActiveIncident = z.infer<typeof activeIncidentSchema>;
export type HistoryIncident = z.infer<typeof historyIncidentSchema>;

// log sahifalari filtri: zona/servis + oxirgi N soat (kasr bo'lishi mumkin)
// yoki maxsus oraliq (datetime-local qiymatlari)
export type LogQuery = {
  zone_name: string;
  service_name: string;
} & ({ hours: number } | { start_date: string; end_date: string });

export type IncidentHistoryQuery = LogQuery;

// GET /api/attacker-logs — antiddos_rate_limit_logs (ko'pi bilan 1000 ta)
export const securityLogSchema = z.looseObject({
  time: z.string(),
  zona_name: z.string(),
  service_name: z.string(),
  zona_ip: z.string(),
  log_message: z.string().nullish(),
});

export const securityLogsResponseSchema = z.object({
  logs: z.array(securityLogSchema),
});

export type SecurityLog = z.infer<typeof securityLogSchema>;

// GET /api/audit-logs — antiddos_config_logs; ustunlari attacker-logs bilan bir xil
export const auditLogsResponseSchema = securityLogsResponseSchema;
