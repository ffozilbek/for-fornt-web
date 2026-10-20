"use client";
import { useAttackSummary } from "@/hooks/useDashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crosshair } from "lucide-react";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { formatNumber } from "@/lib/format";
import EmptySheet from "@/components/shared/EmptySheet";
import { useRouter } from "next/navigation";

export default function TopTenTargetZones({ hours }: { hours: number }) {
  const { data, isPending, isError, error } = useAttackSummary({
    hours,
    zone: "all",
  });
  const { t } = useTranslation();
  const route = useRouter();
  //   const lang = i18n.resolvedLanguage ?? i18n.language;

  if (isPending) {
    return <CustomSkeleton />;
  }
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const topTenTargetZones = data.top_zones.slice(0, 9);
  let totalPackets = 0;

  const chartConfig = Object.fromEntries(
    topTenTargetZones.map((c, i) => [
      `c${i}`,
      {
        label: c.zone,
        color: `oklch(0.68 0.17 ${(235 + i * 36) % 360})`,
      },
    ]),
  ) satisfies ChartConfig;

  const chartData = topTenTargetZones.map((c, i) => ({
    id: `c${i}`,
    zone: c.zone,
    packets: c.packets,
    incidents: c.incidents,
    fill: `var(--color-c${i})`,
  }));

  topTenTargetZones.map((item) => {
    totalPackets += item.packets;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center relative">
            <Crosshair size={20} />
          </div>
          <span>{t("navigation.top10TargetedZones")}</span>
        </CardTitle>
      </CardHeader>
      {topTenTargetZones.length == 0 ? (
        <EmptySheet />
      ) : (
        <CardContent className="flex items-center gap-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>{t("navigation.zone2")}</TableHead>
                <TableHead>{t("navigation.incidents")}</TableHead>
                <TableHead className="text-right">
                  {t("misc.packets")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topTenTargetZones.map((zone, i) => {
                const href = `/zone/${zone.zone}?hours=${hours}`;
                return (
                  <TableRow
                    className="cursor-pointer"
                    tabIndex={0}
                    onClick={() => route.push(href)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") route.push(href);
                    }}
                    key={i}
                  >
                    <TableCell className="font-medium">{i + 1}</TableCell>
                    <TableCell>{zone.zone}</TableCell>
                    <TableCell>{zone.incidents}</TableCell>

                    <TableCell className="text-right">
                      {formatNumber(zone.packets)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>{t("misc.tOTAL")}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(totalPackets)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          {chartData.length > 0 && (
            <div className="relative h-60 w-60 shrink-0">
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
                              <div className="grid text-right font-mono font-medium">
                                <span>
                                  {formatNumber(Number(value))}{" "}
                                  {t("misc.packets")}
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
          )}
        </CardContent>
      )}
    </Card>
  );
}
