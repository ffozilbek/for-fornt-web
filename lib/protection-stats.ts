// Himoya statistikasi sahifasi hisoblari (eski protection_stats_content.html mantig'i)
import type { TFunction } from "i18next";
import type { IndicatorDrops } from "@/types/dashboard";

// backend PDF hisobotidagi ranglar bilan bir xil
const COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#a855f7", "#f59e0b",
  "#0ea5e9", "#f43f5e", "#22c55e", "#6366f1", "#ec4899",
];
export const OTHER_COLOR = "#94a3b8";

// grafiklarda ko'rsatiladigan indikatorlar soni; qolgani "Boshqa" bo'ladi
export const CHART_TOP = 10;

export type Indicator = { key: string; packets: number; bits: number; color: string };

// paketlar soni bo'yicha kamayish tartibida saralab rang beradi.
// Rang tartib bo'yicha — pie, bar va jadvalda bir xil bo'ladi
export function colorIndicators(rows: Omit<Indicator, "color">[]): Indicator[] {
  return [...rows]
    .sort((a, b) => b.packets - a.packets || b.bits - a.bits)
    .map((it, i) => ({ ...it, color: COLORS[i % COLORS.length] }));
}

export const indicatorList = (byAttack: Record<string, IndicatorDrops>) =>
  colorIndicators(
    Object.entries(byAttack).map(([key, v]) => ({
      key,
      packets: v.dropped_count,
      bits: v.dropped_byte * 8,
    })),
  );

export const indicatorValue = (it: Indicator, bits: boolean) => (bits ? it.bits : it.packets);

// DB'dagi protection_name -> tarjima; noma'lum nom o'zicha ko'rsatiladi
export const indicatorLabel = (key: string, t: TFunction) =>
  t(`protectionIndicators.${key}`, { defaultValue: key });

// tanlangan birlik bo'yicha saralab, eng kattalarini ajratadi; qolganlari
// yig'indisi `rest` (yo'q bo'lsa 0)
export function topIndicators(items: Indicator[], bits: boolean) {
  const sorted = [...items].sort((a, b) => indicatorValue(b, bits) - indicatorValue(a, bits));
  const top = sorted.slice(0, CHART_TOP);
  const rest = sorted.slice(CHART_TOP).reduce((s, it) => s + indicatorValue(it, bits), 0);
  return { top, rest };
}
