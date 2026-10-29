"use client";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Activity } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { pickPoint, type Point, type StatsFilter } from "@/lib/stats";
import { formatBitrate } from "@/lib/format";
import { useStatsHistory } from "@/hooks/useStatsHistory";

const WINDOW = 60;
const KEYS = ["incoming", "passed", "dropped"] as const;
const fmtTime = (v: number) => new Date(v).toLocaleTimeString("en-GB");

// Y o'q: 3.00M, 1.00M ... (2 ta kasr), 0 va 1000 dan kichiklar oddiy
const axisCompact = new Intl.NumberFormat("en", {
  notation: "compact",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const axisFmt = (v: number) => (v < 1000 ? String(v) : axisCompact.format(v));

// gradient intensivligi: asosan ko'k sezilarli
const FILL_TOP = { incoming: 0.35, passed: 0.15, dropped: 0.15 } as const;

export default function TrafficChart(filter: StatsFilter) {
  const { t } = useTranslation();
  const { data: history, isPending, isError, error } = useStatsHistory();
  const { zone, service, protocol, type } = filter;

  // eski dashboarddagidek faqat haqiqiy nuqtalar: grafik butun kenglikka
  // cho'ziladi va 60 tagacha o'sib boradi (bo'sh slotlar soxta tekis chiziq
  // bilan to'ldirilmaydi)
  const points = useMemo<Point[]>(
    () =>
      (history ?? [])
        .slice(-WINDOW)
        .map((h) => pickPoint(h.zones, { zone, service, protocol, type }, h.t)),
    [history, zone, service, protocol, type],
  );

  if (isPending) return <CustomSkeleton />;
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const chartConfig = {
    incoming: { label: t("misc.incoming"), color: "oklch(0.65 0.2 255)" },
    passed: { label: t("misc.passed"), color: "oklch(0.72 0.17 155)" },
    dropped: { label: t("misc.dropped"), color: "oklch(0.64 0.23 25)" },
  } satisfies ChartConfig;

  const yFmt = type === "bits" ? formatBitrate : axisFmt;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Activity size={20} />
          </div>
          <span>
            {type === "bits" ? t("misc.bitsSBps") : t("misc.packetsSPps")}
          </span>
        </CardTitle>
        <span className="text-sm text-muted-foreground">
          {t("misc.last60Seconds")}
        </span>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-80 w-full">
          <AreaChart data={points} margin={{ top: 20, left: 0, right: 8 }}>
            <defs>
              {KEYS.map((k) => (
                <linearGradient
                  key={k}
                  id={`traffic-${k}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={`var(--color-${k})`}
                    stopOpacity={FILL_TOP[k]}
                  />
                  <stop
                    offset="95%"
                    stopColor={`var(--color-${k})`}
                    stopOpacity={0.02}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="t"
              interval={4}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={fmtTime}
            />
            <YAxis
              width={64}
              tickCount={4}
              domain={[0, "auto"]}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFmt}
            />

            <ChartTooltip
              cursor={{ strokeDasharray: "4 4" }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, p) =>
                    p?.[0] ? fmtTime(p[0].payload.t) : ""
                  }
                />
              }
            />
            <ChartLegend
              verticalAlign="bottom"
              align="right"
              content={<ChartLegendContent />}
            />

            {KEYS.map((k) => (
              <Area
                key={k}
                dataKey={k}
                type="monotone"
                stroke={`var(--color-${k})`}
                strokeWidth={2}
                fill={`url(#traffic-${k})`}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: "#fff",
                  stroke: `var(--color-${k})`,
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
