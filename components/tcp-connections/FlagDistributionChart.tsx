"use client";

import { useTranslation } from "react-i18next";
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import TooltipRow from "@/components/statistics/TooltipRow";
import { CATS } from "@/lib/tcp-indicators";

const CURRENT = "#58a6ff";
const BASELINE = "#8b949e";

type Props = { title: string; current: number[]; baseline: number[] };

// hozirgi flag taqsimoti (ustun) va baseline (silliq "qo'ng'iroq" maydoni), %
export default function FlagDistributionChart({ title, current, baseline }: Props) {
  const { t } = useTranslation();
  const config = {
    current: { label: t("misc.current"), color: CURRENT },
    baseline: { label: t("misc.baseline"), color: BASELINE },
  } satisfies ChartConfig;
  const data = CATS.map((cat, i) => ({ cat, current: current[i] ?? 0, baseline: baseline[i] ?? 0 }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-60 w-full">
          <ComposedChart data={data} margin={{ left: 0, right: 8 }}>
            <defs>
              <linearGradient id="tcp-baseline-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={BASELINE} stopOpacity={0.35} />
                <stop offset="95%" stopColor={BASELINE} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="cat" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              width={44}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${v}%`}
            />
            <ChartTooltip
              isAnimationActive={false}
              content={
                <ChartTooltipContent
                  formatter={(value, name, item) => (
                    <TooltipRow
                      color={item.color ?? ""}
                      label={config[name as keyof typeof config]?.label ?? String(name)}
                      value={`${Number(value).toFixed(1)}%`}
                    />
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="current" fill={CURRENT} radius={2} maxBarSize={48} isAnimationActive={false} />
            <Area
              dataKey="baseline"
              type="monotone"
              stroke={BASELINE}
              strokeWidth={2}
              fill="url(#tcp-baseline-fill)"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
