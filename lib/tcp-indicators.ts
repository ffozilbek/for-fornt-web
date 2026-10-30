// All TCP Connections sahifasi hisoblari (eski active_sessions_content.html mantig'i)
import type { TcpBaselineResponse, TcpRecord } from "@/types/dashboard";

export const LIVE_POINTS = 60; // live oyna, soniya

export type TcpPoint = { t: number; d: TcpRecord };

// tarix so'rovi: oxirgi N daqiqa yoki maxsus oraliq (epoch sek)
export type TcpHistoryRange = { minutes: number } | { start: number; end: number };

export const DOM_MODES = ["static", "hour", "day", "week"] as const;
export type DomMode = (typeof DOM_MODES)[number];

export const CLIENT_FIELDS = [
  "c_syn", "c_ack_to_syn_ack", "c_ack_empty", "c_ack_data", "c_psh_ack_data", "c_fin_ack", "c_rst",
] as const;
export const SERVER_FIELDS = [
  "s_syn_ack", "s_ack_empty", "s_ack_data", "s_psh_ack_data", "s_fin_ack", "s_rst",
] as const;

export const num = (d: TcpRecord | undefined, f: string) => Number(d?.[f]) || 0;
export const csum = (d: TcpRecord) => CLIENT_FIELDS.reduce((a, f) => a + num(d, f), 0);
export const ssum = (d: TcpRecord) => SERVER_FIELDS.reduce((a, f) => a + num(d, f), 0);
// tashlangan paketlar INCOMING'da mijoz flaglariga ham kiradi, shuning uchun
// maxraj — csum (barcha mijoz TCP), csum+dropped EMAS
export const dropRate = (d: TcpRecord) => {
  const total = csum(d);
  return total > 0 ? Math.min(100, (num(d, "dropped") / total) * 100) : 0;
};

// =====================================================================
//  Degree of Membership (DoM) — fuzzy-logic metodologiyasi
//  Manbalar: Zadeh 1965 (fuzzy to'plamlar), Lin 1991 (Jensen-Shannon
//  divergensiyasi), Jang 1993 (Gauss/bell MF), Klir & Yuan 1995 (t-normalar),
//  Lakhina et al. SIGCOMM 2005 (trafik belgilari taqsimoti).
//  Har belgi -> mu ∈ [0,1]; vaznli geometrik o'rta (product t-norm) bilan
//  yig'iladi — bitta anomal belgi DoM'ni pastga tortadi.
// =====================================================================
export const CATS = ["SYN", "SYN-ACK", "ACK", "Data", "RST", "FIN-ACK"];

const normVec = (v: number[]) => {
  const s = v.reduce((a, b) => a + b, 0);
  return s > 0 ? v.map((x) => x / s) : v.map(() => 0);
};
// kategoriya sonlari [SYN, SYN-ACK, ACK, Data, RST, FIN-ACK]
const clientCounts = (d: TcpRecord) => [
  num(d, "c_syn"), 0,
  num(d, "c_ack_empty") + num(d, "c_ack_to_syn_ack"),
  num(d, "c_ack_data") + num(d, "c_psh_ack_data"),
  num(d, "c_rst"), num(d, "c_fin_ack"),
];
const serverCounts = (d: TcpRecord) => [
  0, num(d, "s_syn_ack"), num(d, "s_ack_empty"),
  num(d, "s_ack_data") + num(d, "s_psh_ack_data"),
  num(d, "s_rst"), num(d, "s_fin_ack"),
];
// Lidstone/Dirichlet silliqlash baseline tomon: p_i = (count_i + m*base_i)/(N + m).
// Paket kam bo'lsa taqsimot ≈ baseline (Normal); faqat katta N farq qila oladi
const smoothDist = (counts: number[], base: number[], m: number) => {
  const n = counts.reduce((a, b) => a + b, 0);
  return counts.map((c, i) => (c + m * base[i]) / (n + m));
};
export const pct = (v: number[]) => v.map((x) => +(x * 100).toFixed(1));

// best-practice taqsimot: data ustun, handshake muvozanatli, RST kam
const STATIC_BASE = {
  client: [0.12, 0, 0.33, 0.45, 0.02, 0.08],
  server: [0, 0.12, 0.33, 0.45, 0.02, 0.08],
};
// zw — zero-window/ACK, drop — drop ulushi, fi — IP boshiga flow chegarasi
// (undan yuqori — oz IP ko'p flow ochmoqda, HTTP uslubidagi flood)
const STATIC_THRESH = { zw: 0.05, drop: 0.3, fi: 20 };
const WEIGHTS = { dist: 0.4, zw: 0.15, drop: 0.13, flowrate: 0.12, fi: 0.15 };
// DoM oynalari (soniya) — qisqa portlash va uzun flow; umumiy = minimum
const DOM_WINDOWS = [1, 5, 10, 15];
const MF_B = 3; // Z-membership tizzasining keskinligi
const SMOOTH_M = 30; // Dirichlet psevdo-son: taqsimot prior kuchi
export const MIN_SAMPLES = 50; // xulosa uchun oynada kerakli paketlar
export const ANOM = 0.6; // mu shundan past — anomal belgi

// Z-shakl: chegaradan past ~1, yuqorida -> 0 ("katta = yomon" belgilar)
const mfZ = (x: number, theta: number) =>
  theta > 0 ? 1 / (1 + Math.pow(Math.max(0, x) / theta, 2 * MF_B)) : 1;
// Gauss: baseline o'rtachasida 1, og'ish bilan pasayadi (ikki tomonlama)
const mfGauss = (x: number, m: number, s: number) => {
  s = Math.max(s, 1e-6);
  return Math.exp(-((x - m) * (x - m)) / (2 * s * s));
};
// Jensen-Shannon divergensiyasi (log2 -> [0,1]); moslik = 1 - JSD
function jsd(p: number[], q: number[]) {
  const m = p.map((pi, i) => (pi + q[i]) / 2);
  const kl = (a: number[], b: number[]) => {
    let s = 0;
    for (let i = 0; i < a.length; i++) if (a[i] > 0 && b[i] > 0) s += a[i] * Math.log2(a[i] / b[i]);
    return s;
  };
  return Math.min(1, Math.max(0, 0.5 * kl(p, m) + 0.5 * kl(q, m)));
}
// vaznli geometrik o'rta -> DoM ∈ [0,1]
function wgm(mus: number[], ws: number[]) {
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return 1;
  let s = 0;
  for (let i = 0; i < mus.length; i++) s += ws[i] * Math.log(Math.max(mus[i], 1e-6));
  return Math.exp(s / total);
}

export type DomClass = "normal" | "suspect" | "attack";
export const domClass = (v: number): DomClass => (v >= 80 ? "normal" : v >= 60 ? "suspect" : "attack");

export type Baseline = {
  learned: boolean;
  dist: { client: number[]; server: number[] };
  zw: { theta: number };
  drop: { theta: number };
  flowrate: { theta: number };
  fi: { mean: number; std: number };
};

const staticBaseline = (): Baseline => ({
  learned: false,
  dist: { client: STATIC_BASE.client, server: STATIC_BASE.server },
  zw: { theta: STATIC_THRESH.zw },
  drop: { theta: STATIC_THRESH.drop },
  flowrate: { theta: 0 },
  fi: { mean: 0, std: 1 },
});

// o'rganilgan baseline; namuna yo'q bo'lsa static. Chegaralar = o'rtacha + 3σ
export function buildBaseline(resp?: TcpBaselineResponse): Baseline {
  const v = resp?.vectors;
  if (!v || !v.client.some((x) => x > 0)) return staticBaseline();
  const st = resp.client_stats;
  const m = (k: string, d: number) => st[k]?.mean ?? d;
  const sd = (k: string, d: number) => st[k]?.std ?? d;
  return {
    learned: true,
    dist: { client: v.client, server: v.server.some((x) => x > 0) ? v.server : STATIC_BASE.server },
    zw: { theta: Math.max(m("zerowin_ack", 0) + 3 * sd("zerowin_ack", 0), STATIC_THRESH.zw) },
    drop: { theta: Math.max(m("drop", 0) + 3 * sd("drop", 0), 0.05) },
    flowrate: { theta: Math.max(m("flow_rate", 0) + 3 * sd("flow_rate", 0), 1) },
    fi: { mean: m("flows_ips", 1), std: Math.max(sd("flows_ips", 0), 0.1) },
  };
}

// label — misc.* tarjima kaliti
type PartKey = "flagDistribution" | "zeroWindowACK" | "dropRatio" | "flowsIP" | "flowRate";
export type DomPart = { label: PartKey; val: string; mu: number; w: number };
type Parts = { dom: number; parts: DomPart[] };

// Mijoz DoM va har belgi hissasi (tushuntirish uchun). winSec flow tezligini
// normallaydi — 1s/5s/10s/15s oynalar solishtiriladigan bo'ladi
function clientParts(d: TcpRecord, winSec: number, b: Baseline): Parts {
  winSec = Math.max(1, winSec || 1);
  const total = csum(d);
  const ackdata =
    num(d, "c_ack_empty") + num(d, "c_ack_to_syn_ack") + num(d, "c_ack_data") + num(d, "c_psh_ack_data");
  const xZw = ackdata > 0 ? num(d, "zero_window") / ackdata : 0;
  const xDr = total > 0 ? num(d, "dropped") / total : 0;
  const flows = num(d, "unique_src_flows");
  const ips = num(d, "unique_src_ips");
  const xFi = ips > 0 ? flows / ips : 0;
  const distMu = 1 - jsd(smoothDist(clientCounts(d), b.dist.client, SMOOTH_M), b.dist.client);
  const parts: DomPart[] = [
    { label: "flagDistribution", val: `fit ${Math.round(distMu * 100)}%`, mu: distMu, w: WEIGHTS.dist },
    { label: "zeroWindowACK", val: `${(xZw * 100).toFixed(1)}%`, mu: mfZ(xZw, b.zw.theta), w: WEIGHTS.zw },
    { label: "dropRatio", val: `${(xDr * 100).toFixed(1)}%`, mu: mfZ(xDr, b.drop.theta), w: WEIGHTS.drop },
    {
      label: "flowsIP",
      val: xFi.toFixed(1),
      mu: b.learned ? mfGauss(xFi, b.fi.mean, b.fi.std) : mfZ(xFi, STATIC_THRESH.fi),
      w: WEIGHTS.fi,
    },
  ];
  if (b.learned) {
    const xFr = flows / winSec;
    parts.push({ label: "flowRate", val: `${Math.round(xFr)}/s`, mu: mfZ(xFr, b.flowrate.theta), w: WEIGHTS.flowrate });
  }
  return { dom: Math.round(wgm(parts.map((p) => p.mu), parts.map((p) => p.w)) * 100), parts };
}

// server: faqat taqsimot mosligi (qaytish yo'lida manba/drop ko'rsatkichlari yo'q)
function serverParts(d: TcpRecord, b: Baseline): Parts {
  const mu = 1 - jsd(smoothDist(serverCounts(d), b.dist.server, SMOOTH_M), b.dist.server);
  return { dom: Math.round(mu * 100), parts: [{ label: "flagDistribution", val: `fit ${Math.round(mu * 100)}%`, mu, w: 1 }] };
}

// oxirgi n soniyani bitta yozuvga yig'ish (flaglar qo'shiluvchan; unique_*
// ulush uchun taxminan qo'shiladi)
function aggPoints(points: TcpPoint[], n: number): TcpRecord {
  const out: TcpRecord = {};
  for (const p of points.slice(Math.max(0, points.length - n)))
    for (const k in p.d) out[k] = (out[k] ?? 0) + (Number(p.d[k]) || 0);
  return out;
}

// son — xulosa, 'low' — MIN_SAMPLES'dan kam, null — trafik yo'q
export type Verdict = number | "low" | null;
export type WhyInfo = Parts & { n: number; state: "ok" | "low" };
export type DomSide = { badge: Verdict; info: WhyInfo | null; label: string | null };
// label: "1s" ... yoki "window" (tarix — butun oraliq)
export type DomView = {
  dist: { client: number[]; server: number[] };
  windows: { label: string; c: Verdict; s: Verdict }[];
  client: DomSide;
  server: DomSide;
};

type Win = { label: string; w: number; a: TcpRecord; n: number };

const cellVal = (n: number, fn: () => number): Verdict => (n === 0 ? null : n < MIN_SAMPLES ? "low" : fn());

// tomon badge'i va tushuntirishi: yetarli namunali oynalardan eng yomoni
function pick(wins: Win[], partsFn: (a: TcpRecord, w: number) => Parts): DomSide {
  const ok = wins.filter((x) => x.n >= MIN_SAMPLES);
  if (ok.length) {
    const worst = ok
      .map((x) => ({ x, p: partsFn(x.a, x.w) }))
      .reduce((m, o) => (o.p.dom < m.p.dom ? o : m));
    return { badge: worst.p.dom, info: { ...worst.p, n: worst.x.n, state: "ok" }, label: worst.x.label };
  }
  const low = wins.filter((x) => x.n > 0);
  if (low.length) {
    const big = low.reduce((m, x) => (x.n > m.n ? x : m)); // eng ko'p dalil
    return { badge: "low", info: { ...partsFn(big.a, big.w), n: big.n, state: "low" }, label: big.label };
  }
  return { badge: null, info: null, label: null };
}

// Taqsimot grafiklari va DoM oyna bo'yicha (faqat oxirgi soniya emas).
// live — rolling buferdan 1/5/10/15s oynalar; tarix — butun yuklangan oraliq
export function computeDoM(points: TcpPoint[], live: boolean, histWinSec: number, b: Baseline): DomView | null {
  if (!points.length) return null;

  // taqsimot: live — oxirgi 10s, tarix — butun oraliq
  const distAgg = aggPoints(points, live ? Math.min(10, points.length) : points.length);
  const dist = { client: pct(normVec(clientCounts(distAgg))), server: pct(normVec(serverCounts(distAgg))) };

  const wins = live
    ? DOM_WINDOWS.map((w) => ({ label: `${w}s`, w, a: aggPoints(points, w) }))
    : [{ label: "window", w: Math.max(1, histWinSec || points.length), a: distAgg }];
  const cWins = wins.map((x) => ({ ...x, n: csum(x.a) }));
  const sWins = wins.map((x) => ({ ...x, n: ssum(x.a) }));
  const cFn = (a: TcpRecord, w: number) => clientParts(a, w, b);
  const sFn = (a: TcpRecord) => serverParts(a, b);

  return {
    dist,
    windows: wins.map((x, i) => ({
      label: x.label,
      c: cellVal(cWins[i].n, () => cFn(x.a, x.w).dom),
      s: cellVal(sWins[i].n, () => sFn(x.a).dom),
    })),
    client: pick(cWins, cFn),
    server: pick(sWins, sFn),
  };
}

export const baselineDist = (b: Baseline) => ({ client: pct(b.dist.client), server: pct(b.dist.server) });

// bu sahifa faqat TCP indikatorlari uchun: TCP oilasidagi servislar.
// 'All' protokolli servis ham TCP trafigini qamraydi
export const TCP_FAMILY = new Set(["TCP", "Any TCP", "DNS-TCP", "TLS", "SSL-L4", "All"]);

// karta qiymatlari: 1.2k, 3.4M
export const fmtCard = (v: number) =>
  v >= 1e9 ? `${(v / 1e9).toFixed(1)}B`
  : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M`
  : v >= 1e3 ? `${(v / 1e3).toFixed(1)}k`
  : String(Math.round(v));
