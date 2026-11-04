// PCAP Management sahifasi yordamchilari (eski pcap_content.html mantig'i)

// C tomondagi pcap_kind_t bilan sinxron
export const PCAP_KINDS = ["incoming", "passed", "dropped", "zoneall"] as const;
export type PcapKind = (typeof PCAP_KINDS)[number];
export const KIND_ID: Record<PcapKind, number> = { dropped: 0, incoming: 1, passed: 2, zoneall: 3 };
export const kindById = (id: number) => PCAP_KINDS.find((k) => KIND_ID[k] === id);

export const SIZE_UNITS = ["KB", "MB", "GB"] as const;
export type SizeUnit = (typeof SIZE_UNITS)[number];

// fayl nomidagi zona/servis backend regex'i bilan bir xil tozalanadi
export const safeName = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, "_");

// fayllar ro'yxati filtri: davr — oxirgi N soat yoki maxsus oraliq (datetime-local)
export type PcapRange = { hours: number } | { start_date: string; end_date: string } | null;

export type PcapFilesQuery = {
  zone: string; // "all" — barcha zonalar
  serviceLabel: string; // "" — barcha servislar; aks holda formatServiceProto yorlig'i
  kind: PcapKind | "all";
  range: PcapRange;
};

export function filesParams(q: PcapFilesQuery): Record<string, string> {
  const p: Record<string, string> = {};
  if (q.zone !== "all") p.zone_name = safeName(q.zone);
  if (q.serviceLabel) p.service_name = safeName(q.serviceLabel);
  if (q.kind !== "all") p.kind = q.kind;
  if (q.range && "hours" in q.range) p.hours = String(q.range.hours);
  else if (q.range) {
    p.start_date = q.range.start_date;
    p.end_date = q.range.end_date;
  }
  return p;
}

export function humanSize(bytes: number) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}
