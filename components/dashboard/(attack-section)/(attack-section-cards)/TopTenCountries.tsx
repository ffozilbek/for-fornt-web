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
import { Globe2Icon } from "lucide-react";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart } from "recharts";
import { countryName } from "@/lib/country";
import { formatNumber } from "@/lib/format";
import EmptySheet from "@/components/shared/EmptySheet";
import { useRouter } from "next/navigation";

export default function TopTenCounrty({ hours }: { hours: number }) {
  const { data, isPending, isError, error } = useAttackSummary({
    hours,
    zone: "all",
  });
  const { t, i18n } = useTranslation();
  const route = useRouter();
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

  const topCountries = data.top_countries.slice(0, 9);
  let totalPackets = 0;

  // console.log(topCountries);

  const chartConfig = Object.fromEntries(
    topCountries.map((c, i) => [
      `c${i}`,
      {
        label: countryName(c.country_code, lang, c.country),
        color: `oklch(0.68 0.17 ${(235 + i * 36) % 360})`,
      },
    ]),
  ) satisfies ChartConfig;

  const chartData = topCountries.map((c, i) => ({
    id: `c${i}`,
    code: c.country_code,
    packets: c.packets,
    fill: `var(--color-c${i})`,
  }));

  topCountries.map((item) => {
    totalPackets += item.packets;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center relative">
            <Globe2Icon size={20} />
          </div>
          <span>{t("misc.top10AttackSourcesByCountry")}</span>
        </CardTitle>
      </CardHeader>
      {topCountries.length == 0 ? (
        <EmptySheet />
      ) : (
        <CardContent className="flex items-center gap-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>№</TableHead>
                <TableHead>{t("misc.country")}</TableHead>
                <TableHead>{t("misc.flag")}</TableHead>
                <TableHead className="text-right">
                  {t("misc.attackers")}
                </TableHead>
                <TableHead className="text-right">
                  {t("misc.packets")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topCountries.map((country, i) => {
                const href = `/country/${country.country_code}?hours=${hours}`;
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
                    <TableCell>
                      {countryName(country.country_code, lang, country.country)}
                    </TableCell>
                    <TableCell>
                      <Image
                        src={`/flags/${country.country_code}.svg`}
                        alt={country.country_code}
                        width={20}
                        height={20}
                        unoptimized
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {country.attackers}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(country.packets)}
                    </TableCell>
                  </TableRow>
                );
              })}
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
