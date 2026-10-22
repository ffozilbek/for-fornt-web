import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatBytes, formatNumber } from "@/lib/format";
import { SummaryDetail } from "@/types/dashboard";
import { useTranslation } from "react-i18next";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function DetailPieChart({ data }: { data: SummaryDetail }) {
  const { t } = useTranslation();
  const prot = data.charts?.protocols || [];
  const series = data.charts?.series || [];

  let totalPackets = 0;

  const chartConfig = Object.fromEntries(
    prot.map((item, i) => [
      `p${i}`,
      {
        label: item.name,
        color: `oklch(0.68 0.17 ${(235 + i * 50) % 360})`,
      },
    ]),
  ) satisfies ChartConfig;

  const pieChartData = prot.map((item, i) => ({
    id: `p${i}`,
    name: item.name,
    packets: item.packets,
    bytes: item.bytes,
    fill: `var(--color-p${i})`,
  }));

  const areaChartConfig = {
    tcp: { label: "TCP", color: "oklch(0.68 0.17 235)" },
    udp: { label: "UDP", color: "oklch(0.68 0.17 285)" },
    icmp: { label: "ICMP", color: "oklch(0.68 0.17 335)" },
    other: { label: "Other", color: "oklch(0.68 0.17 25)" },
  } satisfies ChartConfig;

  prot.forEach((item) => {
    totalPackets += item.packets;
  });

  const areaChartData = series.map((s) => ({
    ...s,
    time: s.t.slice(11, 16), // "2026-10-16T13:40:00" -> "13:40"
  }));

  return (
    <div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <CardHeader>
            <CardTitle>{t("breakdowns.protocols")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>№</TableHead>
                  <TableHead>{t("misc.protocol3")}</TableHead>
                  <TableHead>{t("misc.bytes")}</TableHead>
                  <TableHead className="text-right">
                    {t("misc.packets")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prot.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{formatBytes(item.bytes ?? 0)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(item.packets)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* PIE CHART */}
        <Card>
          <CardHeader>
            <CardTitle>{t("misc.useProtocols")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieChartData.length > 0 && (
              <div className="w-full flex flex-col justify-between items-center gap-5">
                <div className="relative h-80 w-80 shrink-0">
                  <ChartContainer
                    config={chartConfig}
                    className="relative w-full mx-auto aspect-square max-h-90 z-10"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            formatter={(value, name, item) => {
                              const row = item.payload as {
                                id: string;
                                bytes: number;
                              };
                              const cfg = chartConfig[row.id];

                              return (
                                <div className="flex flex-1 items-center justify-between gap-4">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-xs"
                                      style={{ backgroundColor: cfg?.color }}
                                    />
                                    <span className="text-muted-foreground">
                                      {cfg?.label}
                                    </span>
                                  </div>
                                  <div className="grid gap-1 text-right font-mono text-[10px]">
                                    <span>
                                      {formatNumber(Number(value))}
                                      {/* {t("misc.packets")} */}
                                    </span>
                                    <span className="text-muted-foreground">
                                      {formatBytes(row.bytes)}
                                    </span>
                                  </div>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                      <Pie
                        data={pieChartData}
                        dataKey="packets"
                        nameKey="id"
                        innerRadius="70%"
                        outerRadius="100%"
                        strokeWidth={5}
                        isAnimationActive={false}
                      />
                    </PieChart>
                  </ChartContainer>

                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-0">
                    <span className="text-2xl font-bold">
                      {formatNumber(totalPackets)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {t("misc.packets")}
                    </span>
                  </div>
                </div>
                <ul className="grid grid-cols-3 gap-2 text-sm">
                  {pieChartData.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-xs"
                        style={{ backgroundColor: chartConfig[item.id]?.color }}
                      />
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AREA CHART */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>{t("misc.blockedPacketsbyTime")}</CardTitle>
          </CardHeader>
          <CardContent>
            {areaChartData.length > 0 && (
              <ChartContainer config={areaChartConfig} className="h-72 w-full">
                <AreaChart
                  accessibilityLayer
                  data={areaChartData}
                  margin={{ left: 12, right: 12 }}
                >
                  <defs>
                    {(["tcp", "udp", "icmp", "other"] as const).map((key) => (
                      <linearGradient
                        key={key}
                        id={`fill-${key}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor={`var(--color-${key})`}
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor={`var(--color-${key})`}
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickCount={4}
                    width={60}
                    tickFormatter={(v) => formatNumber(Number(v))}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Area
                    dataKey="other"
                    type="monotone"
                    fill="url(#fill-other)"
                    fillOpacity={0.4}
                    stroke="var(--color-other)"
                    stackId="a"
                  />
                  <Area
                    dataKey="icmp"
                    type="monotone"
                    fill="url(#fill-icmp)"
                    fillOpacity={0.4}
                    stroke="var(--color-icmp)"
                    stackId="a"
                  />
                  <Area
                    dataKey="udp"
                    type="monotone"
                    fill="url(#fill-udp)"
                    fillOpacity={0.4}
                    stroke="var(--color-udp)"
                    stackId="a"
                  />
                  <Area
                    dataKey="tcp"
                    type="monotone"
                    fill="url(#fill-tcp)"
                    fillOpacity={0.4}
                    stroke="var(--color-tcp)"
                    stackId="a"
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
