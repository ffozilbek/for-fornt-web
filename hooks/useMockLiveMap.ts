import { useEffect, useState } from "react";
import type { MapPoint, MapTarget } from "@/components/dashboard/LiveMapCanvas";

export const TARGET: MapTarget = { lat: 41.3, lon: 69.24 }; // Toshkent

const ORIGINS: MapPoint[] = [
  { code: "us", name: "United States", lat: 38, lon: -97, packets: 820_000 },
  { code: "cn", name: "China", lat: 35, lon: 103, packets: 640_000 },
  { code: "ru", name: "Russia", lat: 56, lon: 38, packets: 510_000 },
  { code: "br", name: "Brazil", lat: -10, lon: -52, packets: 330_000 },
  { code: "de", name: "Germany", lat: 51, lon: 10, packets: 290_000 },
  { code: "in", name: "India", lat: 21, lon: 78, packets: 260_000 },
  { code: "tr", name: "Türkiye", lat: 39, lon: 35, packets: 210_000 },
  { code: "ng", name: "Nigeria", lat: 9, lon: 8, packets: 180_000 },
  { code: "jp", name: "Japan", lat: 36, lon: 138, packets: 150_000 },
  { code: "au", name: "Australia", lat: -25, lon: 134, packets: 120_000 },
  { code: "mx", name: "Mexico", lat: 23, lon: -102, packets: 110_000 },
  { code: "za", name: "South Africa", lat: -29, lon: 24, packets: 90_000 },
];

// Backend yo'q: har 1.5 soniyada qiymatlarni tasodifiy tebratib, "jonli" ko'rinish beradi
export function useMockLiveMap(): MapPoint[] {
  const [points, setPoints] = useState(ORIGINS);
  useEffect(() => {
    const id = setInterval(() => {
      setPoints(
        ORIGINS.map((o) => ({
          ...o,
          packets: Math.round(o.packets * (0.55 + Math.random() * 0.9)),
        })),
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);
  return points;
}
