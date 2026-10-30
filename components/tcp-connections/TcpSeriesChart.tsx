"use client";

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts";
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
import type { TcpPoint } from "@/lib/tcp-indicators";
import type { TcpRecord } from "@/types/dashboard";

export type TcpSeries = {
  key: string;
  label: string;
  color: string;
  get: (d: TcpRecord) => number;
};
export type Zoom = [number, number] | null;

const intFmt = (v: number) => Math.round(v).toLocaleString("en");
const p2 = (n: number) => String(n).padStart(2, "0");
const fmtTime = (ms: number, withDate: boolean) => {
  const d = new Date(ms);
  const time = `${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
  return withDate ? `${p2(d.getDate())}.${p2(d.getMonth() + 1)} ${time}` : time;
};

type Props = {
  title: string;
  series: TcpSeries[];
  points: TcpPoint[];
  area?: boolean;
  yFmt?: (v: number) => string;
  withDate?: boolean;
  zoom: Zoom;
  // berilmasa (live) sichqoncha bilan zoom o'chiq
  onZoom?: (zoom: [number, number]) => void;
};

// vaqt bo'yicha qatorlar; tarixda sichqoncha bilan sudrab zoom qilinadi
// (barcha grafiklarga umumiy)
export default function TcpSeriesChart({
  title,
  series,
  points,
  area,
  yFmt = intFmt,
  withDate = false,
  zoom,
  onZoom,
}: Props) {
  const [drag, setDrag] = useState<{ a: number; b?: number } | null>(null);

  const config = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }]),
  ) satisfies ChartConfig;

  const data = useMemo(() => {
    const rows = points.map((p) => ({
      t: p.t,
      ...Object.fromEntries(series.map((s) => [s.key, Math.round(s.get(p.d))])),
    }));
    return zoom ? rows.filter((r) => r.t >= zoom[0] && r.t <= zoom[1]) : rows;
  }, [points, series, zoom]);

  const endDrag = () => {
    if (drag?.b !== undefined && drag.b !== drag.a && onZoom)
      onZoom([Math.min(drag.a, drag.b), Math.max(drag.a, drag.b)]);
    setDrag(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-64 w-full select-none">
          <ComposedChart
            data={data}
            margin={{ left: 0, right: 8 }}
            onMouseDown={(e) =>
              onZoom &&
              e.activeLabel !== undefined &&
              setDrag({ a: Number(e.activeLabel) })
            }
            onMouseMove={(e) =>
              drag &&
              e.activeLabel !== undefined &&
              setDrag({ ...drag, b: Number(e.activeLabel) })
            }
            onMouseUp={endDrag}
            onMouseLeave={() => setDrag(null)}
          >
            <defs>
              {area &&
                series.map((s) => (
                  <linearGradient
                    key={s.key}
                    id={`tcp-fill-${s.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
              tickFormatter={(v: number) => fmtTime(v, withDate)}
            />
            <YAxis
              width={64}
              tickCount={5}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFmt}
            />
            <ChartTooltip
              isAnimationActive={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const t = (
                      payload?.[0]?.payload as { t?: number } | undefined
                    )?.t;
                    return t === undefined ? "" : fmtTime(t, withDate);
                  }}
                  formatter={(value, name, item) => (
                    <TooltipRow
                      color={item.color ?? ""}
                      label={config[String(name)]?.label ?? String(name)}
                      value={yFmt(Number(value))}
                    />
                  )}
                />
              }
            />
            {/* ko'p seriyali legend siqilmasin — qatorga o'raladi */}
            {series.length > 1 && (
              <ChartLegend
                content={
                  <ChartLegendContent className="flex-wrap gap-y-1 [&>div]:whitespace-nowrap" />
                }
              />
            )}
            {series.map((s) =>
              area ? (
                <Area
                  key={s.key}
                  dataKey={s.key}
                  type="linear"
                  stroke={s.color}
                  strokeWidth={1.4}
                  fill={`url(#tcp-fill-${s.key})`}
                  dot={false}
                  isAnimationActive={false}
                />
              ) : (
                <Line
                  key={s.key}
                  dataKey={s.key}
                  type="linear"
                  stroke={s.color}
                  strokeWidth={1.6}
                  dot={false}
                  isAnimationActive={false}
                />
              ),
            )}
            {drag?.b !== undefined && (
              <ReferenceArea
                x1={drag.a}
                x2={drag.b}
                strokeOpacity={0.3}
                fillOpacity={0.15}
              />
            )}
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
