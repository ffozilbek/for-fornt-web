"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Network } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import SelectDisplayType from "@/components/shared/SelectDisplayType";
import TooltipRow from "@/components/statistics/TooltipRow";
import {
  DIRS,
  PROTO_COLORS,
  ServiceKind,
  Totals,
  formatValue,
  protoLabel,
  protocolBreakdown,
} from "@/lib/statistics";
import { ProtoTraffic } from "@/types/dashboard";

const DIR_COLORS = { incoming: "#3b82f6", passed: "#22c55e", dropped: "#ef4444" } as const;

// har protokol uchun kiruvchi/o'tgan/tashlangan kartochkalari va
// kiruvchi trafik taqsimoti (pie)
type Props = {
  kind: ServiceKind;
  totals: Totals;
  otherTraffic?: ProtoTraffic | null;
};

export default function ProtocolBreakdownCard({ kind, totals, otherTraffic }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState("pps");
  const bits = type === "bits";
  const items = protocolBreakdown(kind, totals, bits, otherTraffic);

  const chartConfig = Object.fromEntries(
    items.map((p) => [p.key, { label: protoLabel(p.key, t), color: PROTO_COLORS[p.key] }]),
  ) satisfies ChartConfig;
  const pieData = items.map((p) => ({ key: p.key, value: p.incoming, fill: PROTO_COLORS[p.key] }));
  const totalIncoming = items.reduce((s, p) => s + p.incoming, 0);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Network size={20} />
          </div>
          <span>{t("misc.packetsByAnalysisProtocol")}</span>
        </CardTitle>
        <SelectDisplayType value={type} onChange={setType} />
      </CardHeader>
      {/* kartochkalar keng gridda, pie o'ng tomonda */}
      <CardContent className="grid items-center gap-6 lg:grid-cols-[1fr_16rem]">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((p) => (
            <div key={p.key} className="rounded-lg border p-4">
              <div className="mb-3 font-semibold" style={{ color: PROTO_COLORS[p.key] }}>
                {protoLabel(p.key, t)}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {DIRS.map((d) => (
                  <div key={d}>
                    <div className="font-mono text-lg font-semibold" style={{ color: DIR_COLORS[d] }}>
                      {formatValue(p[d], bits)}
                    </div>
                    <div className="text-muted-foreground text-xs">{t(`misc.${d}`)}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {totalIncoming > 0 && (
          <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full max-w-64">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, _name, item) => {
                      const key = (item.payload as { key: string }).key;
                      return (
                        <TooltipRow
                          color={PROTO_COLORS[key]}
                          label={protoLabel(key, t)}
                          value={formatValue(Number(value), bits)}
                        />
                      );
                    }}
                  />
                }
              />
              <Pie data={pieData} dataKey="value" nameKey="key" strokeWidth={2} isAnimationActive={false} />
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
