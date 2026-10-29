"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban, ShieldCheck } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
  ServiceKind,
  Totals,
  formatValue,
  protoLabel,
  protocolBreakdown,
} from "@/lib/statistics";
import { ProtoTraffic } from "@/types/dashboard";

const DROPPED_COLOR = "#ef4444";

type Props = {
  kind: ServiceKind;
  totals: Totals;
  otherTraffic?: ProtoTraffic | null;
};

export default function DroppedByProtocolChart({ kind, totals, otherTraffic }: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState("pps");
  const bits = type === "bits";
  const items = protocolBreakdown(kind, totals, bits, otherTraffic);

  const chartConfig = {
    dropped: { label: t("misc.dropped"), color: DROPPED_COLOR },
  } satisfies ChartConfig;
  const data = items.map((p) => ({ label: protoLabel(p.key, t), dropped: p.dropped }));
  const total = items.reduce((s, p) => s + p.dropped, 0);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Ban size={20} />
          </div>
          <span>{t("misc.droppedByAnalysisProtocol")}</span>
        </CardTitle>
        <SelectDisplayType value={type} onChange={setType} />
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <ShieldCheck className="mb-3 size-12 text-green-500" />
            <p className="text-muted-foreground">{t("misc.noDrops")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("misc.noDroppedPacketsInTheSelectedCondition")}
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-64 w-full">
            <BarChart data={data} margin={{ top: 20, left: 0, right: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                width={80}
                tickCount={5}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatValue(v, bits)}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <TooltipRow
                        color={DROPPED_COLOR}
                        label={chartConfig.dropped.label}
                        value={formatValue(Number(value), bits)}
                      />
                    )}
                  />
                }
              />
              <Bar dataKey="dropped" fill="var(--color-dropped)" radius={5} maxBarSize={56} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
