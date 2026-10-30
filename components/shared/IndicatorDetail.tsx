import { useMemo } from "react";
import { SummaryDetail } from "@/types/dashboard";
import IndicatorPieChart from "@/components/protection-stats/IndicatorPieChart";
import IndicatorBarChart from "@/components/protection-stats/IndicatorBarChart";
import IndicatorTable from "@/components/protection-stats/IndicatorTable";
import { colorIndicators } from "@/lib/protection-stats";

// Himoya statistikasi sahifasidagi grafiklar va jadval; raw bo'sh bo'lsa
// backend yorlig'i o'zicha ko'rsatiladi
export default function IndicatorDetail({ data }: { data: SummaryDetail }) {
  const items = useMemo(
    () =>
      colorIndicators(
        (data.charts?.indicators ?? []).map((it) => ({
          key: it.raw || it.name,
          packets: it.packets,
          bits: it.bytes * 8,
        })),
      ),
    [data],
  );

  if (items.length === 0) return null;

  return (
    <>
      <div className="grid gap-5 xl:grid-cols-2">
        <IndicatorPieChart items={items} />
        <IndicatorBarChart items={items} />
      </div>
      <IndicatorTable
        items={items}
        totalPackets={items.reduce((s, it) => s + it.packets, 0)}
        totalBits={items.reduce((s, it) => s + it.bits, 0)}
      />
    </>
  );
}
