// Zona servislari uchun sof logika (eski static/js/zones.js dan ko'chirilgan).
// Backend (routes/services.py) ham shu qoidalarni tekshiradi, bu yerda
// foydalanuvchiga saqlashdan oldin xato ko'rsatish uchun takrorlanadi.
import type { TFunction } from "i18next";
import { Service } from "@/types/dashboard";

type T = TFunction;

export const PROTOCOLS = [
  { value: "TCP", label: "TCP" },
  { value: "UDP", label: "UDP" },
  { value: "ICMP", label: "ICMP" },
  { value: "Any TCP", label: "Any TCP" },
  { value: "Any UDP", label: "Any UDP" },
  { value: "DNS-TCP", label: "DNS-TCP" },
  { value: "DNS-UDP", label: "DNS-UDP" },
  { value: "QUIC", label: "QUIC" },
  { value: "TLS", label: "TLS" },
  { value: "PROTO_NUMBER", label: "Protocol Num" },
  { value: "Other", label: "Other Protocol" },
];

export const PROTO_WITH_PORTS = new Set([
  "TCP",
  "UDP",
  "DNS-TCP",
  "DNS-UDP",
  "QUIC",
  "TLS",
]);

// service.protocol -> ruxsat etilgan template.templateType lar
export const PROTO_TO_TEMPLATE_TYPES: Record<string, string[]> = {
  TCP: ["TCP"],
  "Any TCP": ["TCP"],
  UDP: ["UDP"],
  "Any UDP": ["UDP"],
  ICMP: ["ICMP"],
  "DNS-TCP": ["DNS-TCP"],
  "DNS-UDP": ["DNS-UDP"],
  TLS: ["TLS"],
  QUIC: ["QUIC"],
  Other: ["OTHER"],
  PROTO_NUMBER: ["OTHER"],
};

// bitta zonada faqat bittadan bo'la oladigan protokollar
const SINGLETON = new Set(["Any TCP", "Any UDP", "ICMP", "Other", "All"]);
const TCP_FAMILY = ["TCP", "DNS-TCP", "TLS"];
const UDP_FAMILY = ["UDP", "DNS-UDP", "QUIC"];

export type ServiceRow = {
  id: number;
  // backenddagi nomi; yangi (saqlanmagan) qatorda bo'sh
  originalName: string;
  protocol: string;
  ports: string;
  protocolNumber: number;
  protectionProfile: string;
  createdAt: string;
  updatedAt: string;
  editing: boolean;
  dirty: boolean;
  deleted: boolean;
};

let rowSeq = 0;

export const newServiceRow = (): ServiceRow => ({
  id: ++rowSeq,
  originalName: "",
  protocol: "",
  ports: "",
  protocolNumber: 0,
  protectionProfile: "",
  createdAt: "",
  updatedAt: "",
  editing: true,
  dirty: false,
  deleted: false,
});

// asNew = true: duplikat uchun — qator yangi servis sifatida qo'shiladi
export const rowFromService = (s: Service, asNew = false): ServiceRow => ({
  ...newServiceRow(),
  originalName: asNew ? "" : s.serviceName,
  protocol: s.protocol,
  ports: s.ports === "any" ? "" : s.ports,
  protocolNumber: s.protocolNumber,
  protectionProfile: s.protectionProfile,
  createdAt: asNew ? "" : s.createdAt,
  updatedAt: asNew ? "" : s.updatedAt,
  editing: false,
});

// servis nomi qo'lda kiritilmaydi, protokol va portdan yasaladi
export const autoServiceName = (r: ServiceRow) => {
  const proto = r.protocol.trim();
  if (!proto) return "";
  if (proto === "Any TCP") return "any-tcp";
  if (proto === "Any UDP") return "any-udp";
  if (proto === "ICMP") return "icmp";
  if (proto === "Other") return "other-proto";
  if (proto === "PROTO_NUMBER") return `proto-${r.protocolNumber || 0}`;
  const slug = proto
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const ports = r.ports.trim().replace(/[^0-9,-]/g, "");
  return ports ? `${slug}-${ports}` : `${slug}-any`;
};

const validatePorts = (ports: string, t: T): string | null => {
  const parts = ports
    .trim()
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  for (const ch of parts) {
    if (ch.includes("-")) {
      const [a, b] = ch.split("-", 2).map((x) => x.trim());
      if (!/^\d+$/.test(a) || !/^\d+$/.test(b))
        return `${t("errors.invalidPortRange")} '${ch}'`;
      const ai = Number(a);
      const bi = Number(b);
      if (ai < 1 || ai > 65535 || bi < 1 || bi > 65535 || ai > bi)
        return `${t("errors.invalidPortRange165535")} '${ch}'`;
    } else {
      if (!/^\d+$/.test(ch)) return `${t("errors.invalidPort")} '${ch}'`;
      const p = Number(ch);
      if (p < 1 || p > 65535)
        return `${t("misc.portOutOfRange165535")} '${ch}'`;
    }
  }
  return null;
};

const validateProtocolNumber = (n: number, t: T): string | null => {
  if (!Number.isInteger(n) || n === 0)
    return t("misc.protocolNumberMustBeANumber");
  if (n < 1 || n > 255) return t("misc.protocolNumberMustBeInRange1255");
  if (n === 1 || n === 6 || n === 17)
    return t("misc.ICMP6TCP17UDPAreSelectedAsSeparateTypes");
  return null;
};

export const validateServiceRow = (r: ServiceRow, t: T): string | null => {
  if (!r.protocol) return t("misc.selectAProtocol");
  if (PROTO_WITH_PORTS.has(r.protocol)) {
    const ports = r.ports.trim();
    if (!ports)
      return t("misc.enterAPortForProto").replace("{proto}", r.protocol);
    // barcha portlar uchun Any TCP / Any UDP servisi ishlatiladi
    if (ports.toLowerCase() === "any") {
      const fam = TCP_FAMILY.includes(r.protocol) ? "Any TCP" : "Any UDP";
      return t("misc.enterASpecificPortForProtoCreateAnFamSer")
        .replace("{proto}", r.protocol)
        .replace("{fam}", fam);
    }
    return validatePorts(ports, t);
  }
  if (r.protocol === "PROTO_NUMBER")
    return validateProtocolNumber(r.protocolNumber, t);
  return null;
};

const parsePortRanges = (s: string): [number, number][] => {
  const out: [number, number][] = [];
  for (const chunk of s.split(",")) {
    const c = chunk.trim();
    if (!c || c.toLowerCase() === "any") continue;
    if (c.includes("-")) {
      const [a, b] = c.split("-", 2).map((x) => parseInt(x.trim(), 10));
      if (!isNaN(a) && !isNaN(b)) out.push([Math.min(a, b), Math.max(a, b)]);
    } else {
      const p = parseInt(c, 10);
      if (!isNaN(p)) out.push([p, p]);
    }
  }
  return out;
};

const rangesOverlap = (r1: [number, number][], r2: [number, number][]) =>
  r1.some(([a1, b1]) => r2.some(([a2, b2]) => !(b1 < a2 || b2 < a1)));

// o'chirilmagan barcha qatorlar: per-row + cross-row tekshiruv.
// Xato bo'lsa birorta ham servis yuborilmaydi (qisman saqlanmasligi uchun).
export const validateServiceRows = (rows: ServiceRow[], t: T): string[] => {
  const visible = rows.filter((r) => !r.deleted);
  const errors: string[] = [];

  for (const r of visible) {
    const err = validateServiceRow(r, t);
    if (err) errors.push(err);
  }

  const protoCount: Record<string, number> = {};
  for (const r of visible)
    if (SINGLETON.has(r.protocol))
      protoCount[r.protocol] = (protoCount[r.protocol] ?? 0) + 1;
  for (const [p, n] of Object.entries(protoCount))
    if (n > 1)
      errors.push(
        `'${p}' ${t("navigation.canAppearOnlyOnceInAZone")} (${n} ${t("misc.entered")})`,
      );

  const pnCount: Record<number, number> = {};
  for (const r of visible)
    if (r.protocol === "PROTO_NUMBER" && r.protocolNumber > 0)
      pnCount[r.protocolNumber] = (pnCount[r.protocolNumber] ?? 0) + 1;
  for (const [n, c] of Object.entries(pnCount))
    if (c > 1)
      errors.push(
        `Protocol Number ${n} ${t("navigation.canAppearOnlyOnceInAZone")}`,
      );

  const checkFamily = (family: string[], label: string) => {
    const items = visible
      .filter((r) => family.includes(r.protocol))
      .map((r) => ({
        name: autoServiceName(r),
        proto: r.protocol,
        ports: parsePortRanges(r.ports),
      }));
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++)
        if (rangesOverlap(items[i].ports, items[j].ports))
          errors.push(
            `'${items[i].name}' (${items[i].proto}) ${t("misc.and")} '${items[j].name}' (${items[j].proto}) ${t("misc.portsOverlap")} (${label} ${t("misc.family")})`,
          );
  };
  checkFamily(TCP_FAMILY, "TCP");
  checkFamily(UDP_FAMILY, "UDP");

  return [...new Set(errors)];
};
