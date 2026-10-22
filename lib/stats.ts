import { SERVICE_NONE, SERVICE_RESPONSE } from "@/lib/constants";
import type { StatsService, StatsZone } from "@/types/dashboard";

export type StatsFilter = {
  zone: string;
  service: string;
  protocol: string;
  type: string;
};
export type Point = {
  t: number;
  incoming: number;
  passed: number;
  dropped: number;
};

const DIRS = ["incoming", "passed", "dropped"] as const;
type Counter = { count: number; bytes: number };
const n = (o: Record<string, unknown>, k: string) => Number(o[k] ?? 0);

function zoneValues(z: StatsZone, protocol: string, bits: boolean) {
  const out = { incoming: 0, passed: 0, dropped: 0 };
  for (const d of DIRS) {
    const key =
      protocol === "all"
        ? `total_${d}_${bits ? "bytes" : "packets"}`
        : `${protocol}_${d}${bits ? "_bytes" : ""}`;
    out[d] = n(z, key);
  }
  return out;
}

function serviceValues(s: StatsService, protocol: string, bits: boolean) {
  const rec = s as Record<string, unknown>;
  const P = protocol.toUpperCase();
  const out = { incoming: 0, passed: 0, dropped: 0 };
  for (const d of DIRS) {
    if (protocol === "all") {
      out[d] = n(rec, `${d}_${bits ? "bytes" : "count"}`);
    } else {
      const map = rec[`${d}_proto`] as Record<string, Counter> | undefined;
      const c = map?.[P];
      out[d] = c ? (bits ? c.bytes : c.count) : 0;
    }
  }
  return out;
}

export function pickPoint(
  zones: StatsZone[],
  f: StatsFilter,
  t: number,
): Point {
  const bits = f.type === "bits";
  const selected =
    f.zone === "all" ? zones : zones.filter((z) => z.zone_name === f.zone);
  const isIndex = /^\d+$/.test(f.service);
  const idx = Number(f.service);
  const acc = { incoming: 0, passed: 0, dropped: 0 };
  const add = (v: typeof acc) => DIRS.forEach((d) => (acc[d] += v[d]));

  for (const z of selected) {
    if (f.service === "all") {
      add(zoneValues(z, f.protocol, bits));
      continue;
    }
    const total = zoneValues(z, f.protocol, bits);
    const svcs = z.services.map((s) => serviceValues(s, f.protocol, bits));

    if (f.service === SERVICE_NONE) {
      acc.dropped += Math.max(
        0,
        total.dropped - svcs.reduce((a, s) => a + s.dropped, 0),
      );
    } else if (f.service === SERVICE_RESPONSE) {
      acc.passed += Math.max(
        0,
        total.passed - svcs.reduce((a, s) => a + s.passed, 0),
      );
    } else if (isIndex && svcs[idx]) {
      add(svcs[idx]);
    }
  }

  const k = bits ? 8 : 1;
  return {
    t,
    incoming: acc.incoming * k,
    passed: acc.passed * k,
    dropped: acc.dropped * k,
  };
}
