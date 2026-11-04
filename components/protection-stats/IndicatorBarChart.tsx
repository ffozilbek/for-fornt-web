"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartColumnBig } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import SelectDisplayType from "@/components/shared/SelectDisplayType";
import TooltipRow from "@/components/statistics/TooltipRow";
import { formatValue } from "@/lib/statistics";
import { Indicator, indicatorLabel, indicatorValue, topIndicators } from "@/lib/protection-stats";

type Row = { label: string; value: number; fill: string };

const ROW_HEIGHT = 32;

// eng ko'p tashlagan indikatorlar — gorizontal ustunlar (nomlar uzun)
export default function IndicatorBarChart({ items }: { items: Indicator[] }) {
  const { t } = useTranslation();
  const [type, setType] = useState("pps");
  const bits = type === "bits";

  const data: Row[] = topIndicators(items, bits).top.map((it) => ({
    label: indicatorLabel(it.key, t),
    value: indicatorValue(it, bits),
    fill: it.color,
  }));

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <ChartColumnBig size={20} />
          </div>
          <span>{t("misc.attackDistribution")}</span>
        </CardTitle>
        <SelectDisplayType value={type} onChange={setType} />
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{}}
          className="w-full"
          style={{ height: Math.max(160, data.length * ROW_HEIGHT + 40) }}
        >
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16 }}>
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickCount={5}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatValue(v, bits)}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={170}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11 }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => {
                    const r = item.payload as Row;
                    return (
                      <TooltipRow color={r.fill} label={r.label} value={formatValue(Number(value), bits)} />
                    );
                  }}
                />
              }
            />
            <Bar dataKey="value" radius={4} maxBarSize={22} isAnimationActive={false}>
              {data.map((r) => (
                <Cell key={r.label} fill={r.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
