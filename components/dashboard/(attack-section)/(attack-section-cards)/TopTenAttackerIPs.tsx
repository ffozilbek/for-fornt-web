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
import { FileUser } from "lucide-react";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Label, Pie, PieChart } from "recharts";
import { countryName } from "@/lib/country";
import { formatNumber } from "@/lib/format";
import EmptySheet from "@/components/shared/EmptySheet";

export default function TopTenAttackerIPs({ hours }: { hours: number }) {
  const { data, isPending, isError, error } = useAttackSummary({
    hours,
    zone: "all",
  });
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;

  if (isPending) {
    return <CustomSkeleton />;
  }
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const topAttackers = data.top_attackers.slice(0, 9);
  let totalPackets = 0;

  const chartConfig = Object.fromEntries(
    topAttackers.map((c, i) => [
      `c${i}`,
      {
        label: countryName(c.country_code, lang, c.country),
        color: `oklch(0.68 0.17 ${(235 + i * 36) % 360})`,
      },
    ]),
  ) satisfies ChartConfig;

  const chartData = topAttackers.map((c, i) => ({
    id: `c${i}`,
    code: c.country_code,
    packets: c.packets,
    fill: `var(--color-c${i})`,
  }));

  topAttackers.map((item) => {
    totalPackets += item.packets;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-muted-foreground gap-2">
          <FileUser size={18} />
          <span>{t("misc.top10AttackerIPs")}</span>
        </CardTitle>
      </CardHeader>
      {topAttackers.length == 0 ? (
        <EmptySheet />
      ) : (
        <CardContent className="flex items-center">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>{t("misc.country")}</TableHead>
                <TableHead>{t("misc.flag")}</TableHead>
                <TableHead className="text-right">{t("misc.srcIP")}</TableHead>
                <TableHead className="text-right">
                  {t("misc.packets")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.top_attackers.map((attacker, i) => (
                <TableRow key={attacker.ip}>
                  <TableCell className="font-medium">{i + 1}</TableCell>
                  <TableCell>
                    {countryName(attacker.country_code, lang, attacker.country)}
                  </TableCell>
                  <TableCell>
                    <Image
                      src={`/flags/${attacker.country_code}.svg`}
                      alt={attacker.country_code}
                      width={20}
                      height={20}
                      unoptimized
                    />
                  </TableCell>
                  <TableCell className="text-right">{attacker.ip}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(attacker.packets)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>{t("misc.tOTAL")}</TableCell>
                <TableCell className="text-right">
                  {formatNumber(totalPackets)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
          {chartData.length > 0 && (
            <ChartContainer
              config={chartConfig}
              className="w-full mx-auto aspect-square max-h-80 flex-1/2"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => (
                        <div className="flex w-full items-center justify-between gap-4">
                          <span>{chartConfig[String(name)]?.label}</span>
                          <span className="font-mono font-medium">
                            {formatNumber(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={chartData}
                  dataKey="packets"
                  nameKey="id"
                  innerRadius={60}
                  strokeWidth={5}
                  isAnimationActive={false}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {formatNumber(totalPackets)}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              {t("misc.packets")}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      )}
    </Card>
  );
}
