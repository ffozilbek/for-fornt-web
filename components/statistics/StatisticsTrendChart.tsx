"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChartLine } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import SelectDisplayType from "@/components/shared/SelectDisplayType";
import TooltipRow from "@/components/statistics/TooltipRow";
import { Bucket, DIRS, Dir, formatValue, metric, protoLabel } from "@/lib/statistics";

type Props = {
  buckets: Bucket[];
  labels: string[];
  protocol: string;
  protocols: string[];
  onProtocol: (p: string) => void;
  selected: number | null;
  onSelect: (index: number) => void;
};

// gradient intensivligi: asosan ko'k sezilarli
const FILL_TOP = { incoming: 0.35, passed: 0.15, dropped: 0.15 } as const;

// vaqt bo'yicha kiruvchi/o'tgan/tashlangan; nuqta bosilsa yuqoridagi
// kartochkalar o'sha davr bo'yicha ko'rsatiladi
export default function StatisticsTrendChart({
  buckets,
  labels,
  protocol,
  protocols,
  onProtocol,
  selected,
  onSelect,
}: Props) {
  const { t } = useTranslation();
  const [type, setType] = useState("pps");
  const bits = type === "bits";

  const chartConfig = {
    incoming: { label: t("misc.incoming"), color: "oklch(0.65 0.2 255)" },
    passed: { label: t("misc.passed"), color: "oklch(0.72 0.17 155)" },
    dropped: { label: t("misc.dropped"), color: "oklch(0.64 0.23 25)" },
  } satisfies ChartConfig;

  const points = buckets.map((b, i) => ({
    label: labels[i],
    incoming: metric(b.totals, protocol, "incoming", bits),
    passed: metric(b.totals, protocol, "passed", bits),
    dropped: metric(b.totals, protocol, "dropped", bits),
  }));

  const items = protocols.map((p) => ({ value: p, label: protoLabel(p, t) }));

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
              <ChartLine size={20} />
            </div>
            <span>{t("misc.trafficTrends")}</span>
          </CardTitle>
          {protocols.length === 1 && protocol !== "all" && (
            <CardDescription className="mt-1">{protoLabel(protocol, t)}</CardDescription>
          )}
        </div>
        <div className="flex gap-2">
          {protocols.length > 1 && (
            <Select items={items} value={protocol} onValueChange={(v) => v && onProtocol(v)}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {items.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <SelectDisplayType value={type} onChange={setType} />
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <AreaChart
            data={points}
            margin={{ top: 20, left: 0, right: 8 }}
            className="cursor-pointer"
            onClick={(s) => {
              if (s.activeTooltipIndex != null) onSelect(Number(s.activeTooltipIndex));
            }}
          >
            <defs>
              {DIRS.map((k) => (
                <linearGradient key={k} id={`stats-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${k})`} stopOpacity={FILL_TOP[k]} />
                  <stop offset="95%" stopColor={`var(--color-${k})`} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
            <YAxis
              width={80}
              tickCount={5}
              domain={[0, "auto"]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatValue(v, bits)}
            />

            <ChartTooltip
              cursor={{ strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <TooltipRow
                      color={chartConfig[name as Dir].color}
                      label={chartConfig[name as Dir].label}
                      value={formatValue(Number(value), bits)}
                    />
                  )}
                />
              }
            />
            <ChartLegend verticalAlign="bottom" align="right" content={<ChartLegendContent />} />

            {selected !== null && points[selected] && (
              <ReferenceLine x={points[selected].label} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
            )}

            {DIRS.map((k) => (
              <Area
                key={k}
                dataKey={k}
                type="monotone"
                stroke={`var(--color-${k})`}
                strokeWidth={2}
                fill={`url(#stats-${k})`}
                dot={false}
                activeDot={{ r: 4, fill: "#fff", stroke: `var(--color-${k})`, strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
