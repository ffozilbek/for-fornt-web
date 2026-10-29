// servisni "TCP 443", "TCP 401,443", "Proto 51", "Any UDP" ko'rinishida
// ko'rsatish (eski dashboard.js dagi formatServiceProto / formatServiceNameRaw)

const PROTO_WITH_PORTS = ["TCP", "UDP", "DNS-TCP", "DNS-UDP", "QUIC", "TLS"];

export const formatServiceProto = (
  protocol: string,
  ports: string,
  protocolNumber: number,
) => {
  // eski 'SSL-L4' yozuvlari TLS deb ko'rsatiladi
  const proto = protocol === "SSL-L4" ? "TLS" : protocol;
  if (proto === "PROTO_NUMBER") return `Proto ${protocolNumber}`;
  if (PROTO_WITH_PORTS.includes(proto)) return ports ? `${proto} ${ports}` : proto;
  return proto;
};

const EXACT: Record<string, string> = {
  icmp: "ICMP",
  "any-tcp": "Any TCP",
  "any-udp": "Any UDP",
  "other-proto": "Other Protocol",
  all: "All",
};

// uzunroq prefikslar avval; 'ssl-l4-' eski slug
const PREFIXES = [
  ["dns-tcp-", "DNS-TCP"],
  ["dns-udp-", "DNS-UDP"],
  ["ssl-l4-", "TLS"],
  ["tls-", "TLS"],
  ["quic-", "QUIC"],
  ["tcp-", "TCP"],
  ["udp-", "UDP"],
];

// servis nomidan ('tcp-443', 'proto-56', 'any-udp') — protokol ma'lumoti
// kelmagan holatlar uchun
export const formatServiceName = (name: string) => {
  const s = name.trim();
  if (EXACT[s]) return EXACT[s];
  const m = /^proto-(\d+)$/.exec(s);
  if (m) return `Proto ${m[1]}`;
  for (const [pref, label] of PREFIXES)
    if (s.startsWith(pref)) {
      const ports = s.slice(pref.length);
      return ports ? `${label} ${ports}` : label;
    }
  return s;
};

export const incidentServiceLabel = (i: {
  service_name?: string | null;
  service_protocol?: string | null;
  service_ports?: string | null;
  service_protocol_number?: number | null;
}) =>
  (i.service_protocol &&
    formatServiceProto(
      i.service_protocol,
      i.service_ports ?? "",
      i.service_protocol_number ?? 0,
    )) ||
  formatServiceName(i.service_name ?? "");
