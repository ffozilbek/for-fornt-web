// Umumiy statistika sahifasi hisoblari (eski stats_content.html mantig'i)
import { SERVICE_NONE, SERVICE_RESPONSE } from "@/lib/constants";
import { formatBits, formatNumber } from "@/lib/format";
import type { TFunction } from "i18next";
import type { LogQuery, ProtoTraffic, Service } from "@/types/dashboard";

export const DIRS = ["incoming", "passed", "dropped"] as const;
export type Dir = (typeof DIRS)[number];
const BASE = ["tcp", "udp", "icmp"] as const;

const MIN = 60_000;
const DAY = 86_400_000;

// yig'indi: `${proto}_${dir}_packets` / `${proto}_${dir}_bytes`,
// proto = total | tcp | udp | icmp
export type Totals = Record<string, number>;

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function readTotals(
  src: Record<string, unknown>,
  packetsKey: (proto: string, d: Dir) => string,
): Totals {
  const out: Totals = {};
  for (const d of DIRS)
    for (const p of ["total", ...BASE]) {
      out[`${p}_${d}_packets`] = num(src[packetsKey(p, d)]);
      out[`${p}_${d}_bytes`] = num(src[`${p}_${d}_bytes`]);
    }
  return out;
}

export const summaryTotals = (s: Record<string, unknown>) =>
  readTotals(s, (p, d) => `${p}_${d}_packets`);

// qatorda tcp/udp/icmp paketlar `tcp_incoming` nomida keladi
const rowTotals = (r: Record<string, unknown>) =>
  readTotals(r, (p, d) => (p === "total" ? `total_${d}_packets` : `${p}_${d}`));

// protocol: all | tcp | udp | icmp | other | proto_<N>; bits — bayt*8.
// proto_<N> trafigi server tomonda servis bo'yicha filtrlangan, ya'ni total.
// other = total − (tcp + udp + icmp)
export function metric(t: Totals, protocol: string, d: Dir, bits: boolean) {
  const unit = bits ? "bytes" : "packets";
  const get = (p: string) => t[`${p}_${d}_${unit}`] ?? 0;
  const v =
    protocol === "other"
      ? Math.max(0, get("total") - BASE.reduce((s, p) => s + get(p), 0))
      : (BASE as readonly string[]).includes(protocol)
        ? get(protocol)
        : get("total");
  return bits ? v * 8 : v;
}

export type ServiceKind = "all" | "none" | "response" | "specific";

export const serviceKind = (service: string): ServiceKind =>
  service === "all"
    ? "all"
    : service === SERVICE_NONE
      ? "none"
      : service === SERVICE_RESPONSE
        ? "response"
        : "specific";

// Traffik tendensiyalari protokol tanlovi. Aniq servis bitta protokolga
// tegishli — bitta qiymat qaytadi va tanlov ko'rsatilmaydi
export function trendProtocols(kind: ServiceKind, svc?: Service): string[] {
  if (kind === "all" || kind === "none") return ["all", "tcp", "udp", "icmp", "other"];
  // qaytuvchi traffik doim TCP/UDP/ICMP
  if (kind === "response") return ["all", "tcp", "udp", "icmp"];
  switch (svc?.protocol) {
    case "TCP":
      return ["tcp"];
    case "UDP":
      return ["udp"];
    case "ICMP":
      return ["icmp"];
    case "Other":
      return ["other"];
    case "PROTO_NUMBER":
      return [`proto_${svc.protocolNumber}`];
    default:
      return ["all"];
  }
}

export type ProtoItem = { key: string } & Record<Dir, number>;

// Protokol kartochkalari, pie va drop grafigi uchun ro'yxat:
// all — TCP/UDP/ICMP/OTHER (OTHER — "Other" servis trafigi, bo'lmasa qoldiq),
// none — TCP/UDP/ICMP/OTHER (qoldiq), response — TCP/UDP/ICMP
export function protocolBreakdown(
  kind: ServiceKind,
  t: Totals,
  bits: boolean,
  otherTraffic?: ProtoTraffic | null,
): ProtoItem[] {
  const make = (key: string): ProtoItem => ({
    key,
    incoming: metric(t, key, "incoming", bits),
    passed: metric(t, key, "passed", bits),
    dropped: metric(t, key, "dropped", bits),
  });
  const list = BASE.map(make);
  if (kind === "response") return list;
  if (kind === "all" && otherTraffic) {
    const unit = bits ? "bytes" : "packets";
    const get = (d: Dir) => otherTraffic[`${d}_${unit}`] * (bits ? 8 : 1);
    return [
      ...list,
      { key: "other", incoming: get("incoming"), passed: get("passed"), dropped: get("dropped") },
    ];
  }
  return [...list, make("other")];
}

// maxsus oraliq: bir necha kunlik oraliqda tugash 00:00 bo'lsa oxirgi kun
// ham kirsin; kelajakka so'rov ma'nosiz — tugash hozirgi vaqt bilan cheklanadi
export function customRange(
  q: { start_date: string; end_date: string },
  now: number,
) {
  const start = new Date(q.start_date);
  const end = new Date(q.end_date);
  if (
    start.toDateString() !== end.toDateString() &&
    end.getHours() === 0 &&
    end.getMinutes() === 0
  )
    end.setHours(23, 59, 0, 0);
  return { start, end: new Date(Math.min(end.getTime(), now)) };
}

export const presetMinutes = (hours: number) => Math.max(1, Math.round(hours * 60));

// so'rov qamragan oraliq (ms)
export function queryRange(q: LogQuery, now: number) {
  if ("hours" in q) return { start: now - presetMinutes(q.hours) * MIN, end: now };
  const { start, end } = customRange(q, now);
  return { start: start.getTime(), end: end.getTime() };
}

// [oraliq daqiqalari chegarasi, qadam daqiqalari] — grafikda ~8..15 nuqta
const MINUTE_STEPS: [number, number][] = [
  [10, 1],
  [20, 2],
  [60, 5],
  [120, 10],
  [240, 20],
  [360, 30],
  [720, 60],
  [1440, 120],
  [2880, 240],
];

export type Bucket = { start: number; end: number; totals: Totals };

// Qatorlarni grafik nuqtalariga yig'ish. Ma'lumot yo'q nuqtalar 0 bo'ladi.
// 3 kundan katta oraliq — kunlik rejim (ko'pi bilan 10 nuqta)
export function bucketize(
  rows: { event_time: string }[],
  start: number,
  end: number,
) {
  const rangeMin = Math.max(1, Math.floor((end - start) / MIN));
  const days = (end - start) / DAY;
  const step = days < 3 ? MINUTE_STEPS.find(([max]) => rangeMin <= max) : undefined;

  let first: number;
  let stepMs: number;
  if (step) {
    stepMs = step[1] * MIN;
    first = Math.floor(start / stepMs) * stepMs;
  } else {
    const d0 = new Date(start);
    d0.setHours(0, 0, 0, 0);
    first = d0.getTime();
    stepMs = Math.max(1, Math.ceil(Math.max(1, Math.ceil(days)) / 10)) * DAY;
  }
  const count = Math.floor((end - first) / stepMs) + 1;

  const buckets: Bucket[] = Array.from({ length: count }, (_, i) => ({
    start: first + i * stepMs,
    end: first + (i + 1) * stepMs,
    totals: {},
  }));
  for (const r of rows) {
    const t = new Date(r.event_time).getTime();
    if (!Number.isFinite(t) || t < first || t > end) continue;
    const b = buckets[Math.min(count - 1, Math.floor((t - first) / stepMs))];
    const add = rowTotals(r as Record<string, unknown>);
    for (const k in add) b.totals[k] = (b.totals[k] ?? 0) + add[k];
  }

  return { buckets, daily: !step, rangeMin };
}

const p2 = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) => `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}`;
const fmtTime = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

// kunlik — sana; aks holda vaqt, kerak bo'lsa sana bilan
export function bucketLabel(start: number, daily: boolean, withDate: boolean) {
  const d = new Date(start);
  if (daily) return fmtDate(d);
  return withDate ? `${fmtDate(d)} ${fmtTime(d)}` : fmtTime(d);
}

export const formatValue = (v: number, bits: boolean) =>
  bits ? formatBits(v) : formatNumber(v);

export const PROTO_COLORS: Record<string, string> = {
  tcp: "#3b82f6",
  udp: "#8b5cf6",
  icmp: "#10b981",
  other: "#f59e0b",
};

// all | tcp | ... | proto_<N> -> ko'rsatiladigan nom (all/other — tarjima)
export const protoLabel = (p: string, t: TFunction) =>
  p === "all"
    ? t("misc.allProtocols")
    : p === "other"
      ? t("misc.other")
      : p.startsWith("proto_")
        ? `Proto #${p.slice(6)}`
        : p.toUpperCase();
