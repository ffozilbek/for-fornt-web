import { useTranslation } from "react-i18next";
import { SummaryDetail } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatBytes, formatNumber } from "@/lib/format";
import { Bar, BarChart, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function IndicatorDetail({ data }: { data: SummaryDetail }) {
  const { t } = useTranslation();
  const indicator = data.charts?.indicators || [];

  let totalPackets = 0;

  const chartConfig = Object.fromEntries(
    indicator.map((item, i) => [
      `p${i}`,
      {
        label: item.name,
        color: `oklch(0.68 0.17 ${(235 + i * 50) % 360})`,
      },
    ]),
  ) satisfies ChartConfig;

  const chartData = indicator.map((item, i) => ({
    id: `p${i}`,
    name: item.name,
    packets: item.packets,
    bytes: item.bytes,
    fill: `var(--color-p${i})`,
  }));

  indicator.forEach((item) => {
    totalPackets += item.packets;
  });

  console.log(data);

  return (
    <div className="grid grid-cols-2 gap-5">
      <Card>
        <CardHeader>
          <CardTitle>{t("misc.shareOfIndicators")}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 && (
            <div className="flex flex-row-reverse justify-between items-center gap-5">
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
                                <div className="grid text-right font-mono">
                                  <span>
                                    {formatNumber(Number(value))}{" "}
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
                      data={chartData}
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
              <ul className="grid gap-2 text-sm">
                {chartData.map((item) => (
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

      <Card>
        <CardHeader>
          <CardTitle>{t("misc.mostActiveProtectionIndicator")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="max-h-90">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
              barCategoryGap={12}
            >
              <YAxis
                dataKey="id"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={220}
                interval={0}
                tickFormatter={(value) => chartConfig[value]?.label as string}
              />
              <XAxis dataKey="packets" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name, item) => {
                      const row = item.payload as { id: string; bytes: number };
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
                          <div className="grid text-right font-mono ">
                            <span>{formatNumber(Number(value))}</span>
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
              <Bar dataKey="packets" radius={5} barSize={24} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>{t("misc.protectionIndicators")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>{t("headers.indicators.title")}</TableHead>
                <TableHead>{t("misc.bytes")}</TableHead>
                <TableHead className="text-right">
                  {t("misc.packets")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicator.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{formatNumber(item.bytes)}</TableCell>
                  <TableCell className="text-right">
                    {formatBytes(item.packets)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
