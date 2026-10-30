"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartPie } from "lucide-react";
import { Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import SelectDisplayType from "@/components/shared/SelectDisplayType";
import TooltipRow from "@/components/statistics/TooltipRow";
import { formatValue } from "@/lib/statistics";
import {
  Indicator,
  OTHER_COLOR,
  indicatorLabel,
  indicatorValue,
  topIndicators,
} from "@/lib/protection-stats";

type Slice = { key: string; label: string; value: number; fill: string };

// indikatorlar ulushi: eng kattalari + "Boshqa", yonida rangli ro'yxat
export default function IndicatorPieChart({ items }: { items: Indicator[] }) {
  const { t } = useTranslation();
  const [type, setType] = useState("pps");
  const bits = type === "bits";

  const { top, rest } = topIndicators(items, bits);
  const data: Slice[] = top.map((it) => ({
    key: it.key,
    label: indicatorLabel(it.key, t),
    value: indicatorValue(it, bits),
    fill: it.color,
  }));
  if (rest > 0) data.push({ key: "__other__", label: t("misc.other"), value: rest, fill: OTHER_COLOR });
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <ChartPie size={20} />
          </div>
          <span>{t("misc.attackDistribution")}</span>
        </CardTitle>
        <SelectDisplayType value={type} onChange={setType} />
      </CardHeader>
      <CardContent className="grid items-center gap-6 sm:grid-cols-[14rem_1fr]">
        <ChartContainer config={{}} className="mx-auto aspect-square w-full max-w-56">
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, _name, item) => {
                    const s = item.payload as Slice;
                    return (
                      <TooltipRow
                        color={s.fill}
                        label={s.label}
                        value={formatValue(Number(value), bits)}
                      />
                    );
                  }}
                />
              }
            />
            <Pie data={data} dataKey="value" nameKey="label" strokeWidth={2} isAnimationActive={false} />
          </PieChart>
        </ChartContainer>

        <ul className="space-y-1.5 text-sm">
          {data.map((d) => (
            <li key={d.key} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: d.fill }} />
              <span className="text-muted-foreground min-w-0 flex-1 truncate" title={d.label}>
                {d.label}
              </span>
              <span className="font-mono tabular-nums">
                {total > 0 ? `${((d.value / total) * 100).toFixed(1)}%` : "—"}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
