// Flow log (JA4) sahifasi yordamchilari (eski flow_log_content.html mantig'i)
import type { TcpRecord } from "@/types/dashboard";

export type GroupBy = "ip" | "ja4" | "ja4t" | "country";
export const GROUP_BYS: GroupBy[] = ["ip", "ja4", "ja4t", "country"];

// C tomoni: 0 — har flow, 1 — 1:N namuna, 2 — faqat yangi JA4/SNI
export const CAPTURE_MODES = ["full", "sample", "new"] as const;
export type CaptureMode = (typeof CAPTURE_MODES)[number];

// flow log faqat TCP/TLS uchun — UDP/QUIC/ICMP servislar ro'yxatda chiqmaydi
export const FLOW_PROTOS = new Set(["TCP", "Any TCP", "DNS-TCP", "TLS"]);

export const LIVE = "live";
export const CUSTOM = "custom";
export const LIMITS = [100, 500, 1000, 2000, 5000];

// jadval so'rovi filtrlari ("Apply" bosilganda qo'llanadi)
export type FlowFilters = {
  service: string; // erkin matn — tanlangan servisdan ustun
  sni: string;
  ja4: string;
  ja4t: string;
  srcIp: string;
  country: string;
  range: string; // live | daqiqalar | custom
  start: number; // custom, epoch sek
  end: number;
  groupBy: GroupBy | "";
  limit: number;
};

export const DEFAULT_FILTERS: FlowFilters = {
  service: "",
  sni: "",
  ja4: "",
  ja4t: "",
  srcIp: "",
  country: "",
  range: LIVE,
  start: 0,
  end: 0,
  groupBy: "",
  limit: 500,
};

// nechta filtr default'dan farq qiladi (Filtr tugmasidagi badge)
export const activeFilterCount = (f: FlowFilters) =>
  [f.service, f.sni, f.ja4, f.ja4t, f.srcIp, f.country].filter((v) => v.trim()).length +
  (f.range !== LIVE ? 1 : 0) +
  (f.groupBy ? 1 : 0);

export type FlowParams = Record<string, string>;

// zona/servis/vaqt/davlat/limit — barcha so'rovlar uchun umumiy.
// live — oxirgi 1 daqiqa (backend minimal oynasi)
export function commonParams(zone: string, service: string, f: FlowFilters): FlowParams {
  const p: FlowParams = { zone };
  const svc = f.service.trim() || (service !== "all" ? service : "");
  if (svc) p.service = svc;
  if (f.range === CUSTOM) {
    p.start = String(f.start);
    p.end = String(f.end);
  } else {
    p.minutes = f.range === LIVE ? "1" : f.range;
  }
  const cc = f.country.trim().toUpperCase();
  if (cc) p.country = cc;
  p.limit = String(f.limit);
  return p;
}

// flat flow ro'yxati uchun matnli filtrlar ham qo'shiladi
export function flowParams(zone: string, service: string, f: FlowFilters): FlowParams {
  const p = commonParams(zone, service, f);
  if (f.sni.trim()) p.sni = f.sni.trim();
  if (f.ja4.trim()) p.ja4 = f.ja4.trim();
  if (f.ja4t.trim()) p.ja4t = f.ja4t.trim();
  if (f.srcIp.trim()) p.src_ip = f.srcIp.trim();
  return p;
}

// tanlangan oraliq uzunligi (soniya) — flow tezligi va sanani ko'rsatish uchun
export const rangeSeconds = (f: FlowFilters) =>
  f.range === LIVE ? 60 : f.range === CUSTOM ? Math.max(1, f.end - f.start) : Number(f.range) * 60;

// grafik vaqt o'qida sana kerakmi (bir kundan uzun yoki kun almashgan oraliq)
export const spansDays = (f: FlowFilters) =>
  f.range === CUSTOM
    ? new Date(f.start * 1000).toDateString() !== new Date(f.end * 1000).toDateString()
    : rangeSeconds(f) >= 86400;

export const num = (r: object, k: string) => Number((r as Record<string, unknown>)[k]) || 0;

// flow_log qatori -> tcp-indicators DoM hisobi kutadigan yozuv
// (flows / src_ips -> unique_src_flows / unique_src_ips)
export function toTcpRecord(r: object): TcpRecord {
  const out: TcpRecord = {};
  for (const [k, v] of Object.entries(r)) if (typeof v === "number") out[k] = v;
  out.unique_src_flows = num(r, "flows");
  out.unique_src_ips = num(r, "src_ips");
  return out;
}

// [yorliq, maydon] — har yo'nalishning TCP flag / TLS record taqsimoti
export type FlagSpec = [string, string][];
export const C_FLAGS: FlagSpec = [
  ["SYN", "c_syn"], ["ACK", "c_ack_empty"], ["ACK+data", "c_ack_data"],
  ["PSH-ACK", "c_psh_ack_data"], ["FIN", "c_fin_ack"], ["RST", "c_rst"],
];
export const S_FLAGS: FlagSpec = [
  ["SYN-ACK", "s_syn_ack"], ["ACK", "s_ack_empty"], ["ACK+data", "s_ack_data"],
  ["PSH-ACK", "s_psh_ack_data"], ["FIN", "s_fin_ack"], ["RST", "s_rst"],
];
export const C_TLS: FlagSpec = [
  ["ClientHello", "c_client_hello"], ["CCS", "c_ccs"], ["AppData", "c_app_data_records"], ["Alert", "c_alert"],
];
export const S_TLS: FlagSpec = [
  ["ServerHello", "s_server_hello"], ["CCS", "s_ccs"], ["AppData", "s_app_data_records"], ["Alert", "s_alert"],
];

// ip / country / ja4t guruhlarida TLS flowlar va SNI ro'yxati bor;
// ja4 / ja4t — barmoq izi, joy emas: bitta bayroq o'rniga davlatlar soni
export const isTlsGroup = (by: GroupBy) => by !== "ja4";
export const isFpGroup = (by: GroupBy) => by === "ja4" || by === "ja4t";

const p2 = (n: number) => String(n).padStart(2, "0");
// epoch sek -> "dd/mm/yy hh:mm:ss"
export const fmtTs = (sec: number) => {
  const d = new Date(sec * 1000);
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${p2(d.getFullYear() % 100)} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
};

export const fmtInt = (v: number) => Math.round(v).toLocaleString("en");

// jadval uchun ixcham hajm (eski UI kabi): 1536 -> "1.5K"
export const fmtB = (v: number) => {
  const u = ["B", "K", "M", "G"];
  let i = 0;
  while (v >= 1024 && i < 3) {
    v /= 1024;
    i++;
  }
  return v.toFixed(i ? 1 : 0) + u[i];
};
