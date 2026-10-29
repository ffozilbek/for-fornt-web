// L3-L4-L5 himoya shablonlari uchun sof logika (eski
// templates/partials/mitigation_templates_content.html dan ko'chirilgan).
// Backend (routes/mitigation_templates.py) ham shu qoidalarni tekshiradi, bu
// yerda foydalanuvchiga saqlashdan oldin xato ko'rsatish uchun takrorlanadi.
import type { TFunction } from "i18next";
import {
  MitigationTemplate,
  TemplateGeo,
  TemplateSmartGeo,
} from "@/types/dashboard";

type T = TFunction;

export const TEMPLATE_TYPES = [
  "BASIC",
  "TCP",
  "UDP",
  "ICMP",
  "TLS",
  "DNS-TCP",
  "DNS-UDP",
  "QUIC",
  "OTHER",
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

export const MAX_TEMPLATE_NAME = 63;
const MAX_TRIGGER_THRESHOLD = 2147483647;
const MAX_BANDWIDTH_GBPS = 100;

export const templateTypeLabel = (type: string, t: T) => {
  if (type === "BASIC") return "Basic Protection";
  if (type === "OTHER") return t("misc.otherProtocolNumber");
  // eski yozuvlarda TLS 'SSL-L4' deb saqlangan
  if (type === "SSL-L4") return "TLS";
  return type;
};

export const BANDWIDTH_UNITS = ["Kbps", "Mbps", "Gbps"] as const;

// backend DEFAULTS bilan bir xil (camelCase). Formadagi barcha maydonlar.
export const TEMPLATE_DEFAULTS = {
  checkIpHeaderMalformed: true,
  geoFilterEnable: false,
  bandwidthEnable: false,
  bandwidthRate: 0,
  bandwidthUnit: "Mbps" as string,
  whitelistEnable: false,
  blacklistEnable: false,
  synCookieEnable: true,
  checkTcpMalformed: true,
  checkTcpConnTracking: true,
  tcpTriggerEnable: true,
  tcpTriggerThreshold: 500,
  tcpSynEnable: false,
  tcpSynTokenRate: 0,
  tcpSynTokenCapacity: 0,
  tcpSynBlockDuration: 60,
  tcpSynViolationThreshold: 5,
  tcpFinEnable: false,
  tcpFinTokenRate: 0,
  tcpFinTokenCapacity: 0,
  tcpFinBlockDuration: 60,
  tcpFinViolationThreshold: 5,
  tcpUrgEnable: false,
  tcpUrgTokenRate: 0,
  tcpUrgTokenCapacity: 0,
  tcpUrgBlockDuration: 60,
  tcpUrgViolationThreshold: 5,
  tcpOtherEnable: false,
  tcpOtherTokenRate: 0,
  tcpOtherTokenCapacity: 0,
  tcpOtherBlockDuration: 60,
  tcpOtherViolationThreshold: 5,
  checkUdpMalformed: true,
  udpRateEnable: false,
  udpTokenRate: 0,
  udpTokenCapacity: 0,
  udpBlockDuration: 60,
  udpViolationThreshold: 5,
  checkIcmpMalformed: true,
  icmpRateEnable: false,
  icmpTokenRate: 0,
  icmpTokenCapacity: 0,
  icmpBlockDuration: 60,
  icmpViolationThreshold: 5,
  checkDnsTcpMalformed: true,
  checkDnsUdpMalformed: true,
  checkQuicMalformed: true,
  otherRateEnable: false,
  otherTokenRate: 0,
  otherTokenCapacity: 0,
  otherBlockDuration: 60,
  otherViolationThreshold: 5,
  sessionEnable: false,
  srcSessionCount: 0,
  allSessionCount: 0,
  deleteSessionTime: 0,
  ja4tBlacklistEnable: false,
  ja4BlacklistEnable: false,
  checkTlsMalformed: false,
  // 0 = All; bit0 = TLS 1.1, bit1 = TLS 1.2, bit2 = TLS 1.3
  tlsAllowedVersions: 0,
  sniAllowlistEnable: false,
  basicTemplateEnable: false,
  basicTemplateName: "",
  tcpTemplateEnable: false,
  tcpTemplateName: "",
  udpTemplateEnable: false,
  udpTemplateName: "",
};

export type TemplateValues = typeof TEMPLATE_DEFAULTS;
export type BoolKey = {
  [K in keyof TemplateValues]: TemplateValues[K] extends boolean ? K : never;
}[keyof TemplateValues];
export type NumKey = {
  [K in keyof TemplateValues]: TemplateValues[K] extends number ? K : never;
}[keyof TemplateValues];

export type RateGroup = {
  enable: BoolKey;
  rate: NumKey;
  capacity: NumKey;
  duration: NumKey;
  threshold: NumKey;
};

// enable maydoni: tcp_* uchun <prefix>Enable, udp/icmp/other uchun <prefix>RateEnable
const rateGroup = (prefix: string, enable: BoolKey): RateGroup => ({
  enable,
  rate: `${prefix}TokenRate` as NumKey,
  capacity: `${prefix}TokenCapacity` as NumKey,
  duration: `${prefix}BlockDuration` as NumKey,
  threshold: `${prefix}ViolationThreshold` as NumKey,
});

export const RATE_GROUPS = {
  tcpSyn: rateGroup("tcpSyn", "tcpSynEnable"),
  tcpFin: rateGroup("tcpFin", "tcpFinEnable"),
  tcpUrg: rateGroup("tcpUrg", "tcpUrgEnable"),
  tcpOther: rateGroup("tcpOther", "tcpOtherEnable"),
  udp: rateGroup("udp", "udpRateEnable"),
  icmp: rateGroup("icmp", "icmpRateEnable"),
  other: rateGroup("other", "otherRateEnable"),
};

const TYPE_RATE_GROUPS: Partial<Record<TemplateType, RateGroup[]>> = {
  TCP: [
    RATE_GROUPS.tcpSyn,
    RATE_GROUPS.tcpFin,
    RATE_GROUPS.tcpUrg,
    RATE_GROUPS.tcpOther,
  ],
  UDP: [RATE_GROUPS.udp],
  ICMP: [RATE_GROUPS.icmp],
  OTHER: [RATE_GROUPS.other],
};

// yangi shablonda rate-limit guruhlari yoqilgan va protokolga mos
// default token rate / capacity bilan boshlanadi (eski UI dagi kabi)
const CREATE_DEFAULTS: Partial<TemplateValues> = {
  tcpSynEnable: true,
  tcpSynTokenRate: 100,
  tcpSynTokenCapacity: 200,
  tcpFinEnable: true,
  tcpFinTokenRate: 100,
  tcpFinTokenCapacity: 200,
  tcpUrgEnable: true,
  tcpUrgTokenRate: 100,
  tcpUrgTokenCapacity: 200,
  tcpOtherEnable: true,
  tcpOtherTokenRate: 100,
  tcpOtherTokenCapacity: 200,
  icmpRateEnable: true,
  icmpTokenRate: 100,
  icmpTokenCapacity: 200,
  udpRateEnable: true,
  udpTokenRate: 500,
  udpTokenCapacity: 1000,
  otherRateEnable: true,
  otherTokenRate: 500,
  otherTokenCapacity: 1000,
};

export const TCP_ATTACH_TYPES: string[] = ["TLS", "DNS-TCP"];
export const UDP_ATTACH_TYPES: string[] = ["DNS-UDP", "QUIC"];
export const SESSION_TYPES: string[] = ["TCP", "UDP"];

export const newTemplateValues = (): TemplateValues => ({
  ...TEMPLATE_DEFAULTS,
  ...CREATE_DEFAULTS,
});

// backend javobidan formaga: faqat ma'lum maydonlar, turi mos kelsa olinadi
export const valuesFromTemplate = (tpl: MitigationTemplate): TemplateValues => {
  const out = { ...TEMPLATE_DEFAULTS } as Record<string, unknown>;
  const src = tpl as Record<string, unknown>;
  for (const [k, def] of Object.entries(TEMPLATE_DEFAULTS)) {
    const v = src[k];
    if (typeof def === "boolean") out[k] = Boolean(v ?? def);
    else if (typeof def === "number")
      out[k] = typeof v === "number" ? v : Number(v ?? def) || 0;
    else out[k] = typeof v === "string" ? v : def;
  }
  return out as TemplateValues;
};

export const TLS_VERSIONS = [
  { bit: 1, label: "TLS 1.1" },
  { bit: 2, label: "TLS 1.2" },
  { bit: 4, label: "TLS 1.3" },
];

const BW_TO_GBPS: Record<string, number> = { Kbps: 1e-6, Mbps: 1e-3, Gbps: 1 };

// xato bo'lsa matn, aks holda null
export const validateTemplate = (
  name: string,
  type: string,
  v: TemplateValues,
  t: T,
): string | null => {
  if (!name.trim()) return t("misc.templateNameIsRequired");
  if (!type) return t("misc.templateTypeNotSelected");

  if (SESSION_TYPES.includes(type) && v.sessionEnable) {
    if (!(v.srcSessionCount > 0))
      return t("misc.srcSessionCountMustBeGreaterThan0");
    if (!(v.allSessionCount > 0))
      return t("misc.allSessionCountMustBeGreaterThan0");
    if (!(v.deleteSessionTime > 0))
      return t("misc.deleteSessionTimeMustBeGreaterThan0");
    if (v.srcSessionCount >= v.allSessionCount)
      return t("misc.srcSessionCountMustBeLessThanAllSessionC");
  }

  if (type === "BASIC" && v.bandwidthEnable) {
    if (!(v.bandwidthRate > 0))
      return t("misc.bandwidthManagementRateValueMustBeGreate");
    const gbps = v.bandwidthRate * (BW_TO_GBPS[v.bandwidthUnit] ?? 1e-3);
    if (gbps > MAX_BANDWIDTH_GBPS)
      return t("misc.bandwidthManagementRateValueMustNotExcee");
  }

  // faqat yoqilgan guruhlar: hamma qiymat > 0, rate < capacity
  for (const g of TYPE_RATE_GROUPS[type as TemplateType] ?? []) {
    if (!v[g.enable]) continue;
    if ([g.rate, g.capacity, g.duration, g.threshold].some((k) => !(v[k] > 0)))
      return t("misc.rateLimitValuesMustBeGreaterThan0");
    if (!(v[g.rate] < v[g.capacity]))
      return t("misc.tokenRatePpsMustBeLessThanTokenCapacity");
  }

  if (TCP_ATTACH_TYPES.includes(type) && v.tcpTemplateEnable && !v.tcpTemplateName)
    return t("misc.tCPProtectionTemplateNotSelected");
  if (UDP_ATTACH_TYPES.includes(type) && v.udpTemplateEnable && !v.udpTemplateName)
    return t("misc.uDPProtectionTemplateNotSelected");
  if (type !== "BASIC" && v.basicTemplateEnable && !v.basicTemplateName)
    return t("misc.basicProtectionTemplateNotSelected");

  if (type === "TCP") {
    if (!(v.tcpTriggerThreshold >= 1))
      return t("misc.tCPTriggerThresholdCannotBeLessThan1");
    if (v.tcpTriggerThreshold > MAX_TRIGGER_THRESHOLD)
      return t("misc.tCPTriggerThresholdMustNotExceed21474836");
  }
  return null;
};

// Geo / Smart Geo — DB da emas, backend json faylida (faqat BASIC turida)
export const newTemplateGeo = (): TemplateGeo => ({
  enabled: true,
  mode: "block",
  countries: [],
});

export const newTemplateSmartGeo = (): TemplateSmartGeo => ({
  enabled: false,
  start: "",
  end: "",
  mode: "block",
  countries: [],
});

export const validateSmartGeo = (smart: TemplateSmartGeo, t: T) =>
  smart.enabled && (!smart.start || !smart.end)
    ? t("misc.enterStartAndEndTimeForSmartGeo")
    : null;

// shu ro'yxatlardan biri yoqilgan yangi shablon saqlangach forma ochiq qoladi —
// fayl/yozuvlarni kiritish uchun saqlangan shablon nomi kerak
export const hasListEnabled = (type: string, v: TemplateValues) =>
  (type === "BASIC" && (v.whitelistEnable || v.blacklistEnable)) ||
  (type === "TCP" && v.ja4tBlacklistEnable) ||
  (type === "TLS" && (v.ja4BlacklistEnable || v.sniAllowlistEnable));
