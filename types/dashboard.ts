// 1. Tizim resurslari modeli (/api/system-resources)
export interface SystemResources {
  cpu: {
    avg_pct: number;
    nb_lcores: number;
    lcores: Array<{
      lcore_id: number;
      is_active: boolean;
      utilization_pct: number;
    }>;
  };
  hugepages: {
    total_mb: number;
    used_mb: number;
    free_mb: number;
    usage_pct: number;
  };
  disk?: {
    total_gb: number;
    used_gb: number;
    free_gb: number;
    usage_pct: number;
  };
}

// 2. Hujumlar statistikasi va Top 10 reytinglar (/api/dashboard/attack-summary)
export interface AttackSummaryResponse {
  status: "success" | "error";
  totals: {
    incidents: number;
    attackers: number;
    dropped_packets: number;
    dropped_bytes: number;
    top_attack_type: {
      type: string;
      incidents: number;
      percentage: number;
    };
  };
  top_attackers: Array<{
    ip: string;
    country_code: string;
    country: string;
    incidents: number;
    packets: number;
    bytes: number;
    last_seen: string;
  }>;
  top_countries: Array<{
    country_code: string;
    country: string;
    attackers: number;
    incidents: number;
    packets: number;
  }>;
  attack_types: Array<{
    type: string;
    incidents: number;
    packets: number;
  }>;
  top_zones: Array<{
    zone: string;
    incidents: number;
    packets: number;
  }>;
}

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
