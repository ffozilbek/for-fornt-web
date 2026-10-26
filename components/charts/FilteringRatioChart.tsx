"use client";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import EmptySheet from "@/components/shared/EmptySheet";
import { useFilterRatio, useServices } from "@/hooks/useDashboard";
import { formatBytes, formatNumber } from "@/lib/format";
import { PERIOD_HOURS, SERVICE_NONE, SERVICE_RESPONSE } from "@/lib/constants";
import { usePersistedState } from "@/hooks/usePersistedState";

type Props = { zone: string; service: string };

export default function FilteringRatioChart({ zone, service }: Props) {
  const { t } = useTranslation();
  const [hours, setHours] = usePersistedState(
    "dashboard.filterRatioHours",
    1,
    PERIOD_HOURS,
  );

  const PERIODS = [
    { value: 1, label: t("misc.last1Hour") },
    { value: 6, label: t("misc.last6Hours") },
    { value: 24, label: t("misc.last24Hours") },
    { value: 168, label: t("misc.last7Days") },
  ];

  const isIndex = /^\d+$/.test(service);
  const { data: services } = useServices(zone);
  const serviceName = isIndex
    ? services?.[Number(service)]?.serviceName
    : service;

  const { data, isPending, isError, error } = useFilterRatio(
    { hours, zone, service: serviceName ?? "all" },
    serviceName !== undefined,
  );

  if (isPending) return <CustomSkeleton />;
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const total = data.passed_packets + data.dropped_packets;
  const blocked = total === 0 ? 0 : (data.dropped_packets / total) * 100;

  const chartConfig = {
    passed: { label: t("misc.passed"), color: "#22c55e" },
    dropped: { label: t("misc.dropped"), color: "#ef4444" },
  } satisfies ChartConfig;

  const chartData = [
    {
      id: "passed",
      packets: data.passed_packets,
      bytes: data.passed_bytes,
      fill: "var(--color-passed)",
    },
    {
      id: "dropped",
      packets: data.dropped_packets,
      bytes: data.dropped_bytes,
      fill: "var(--color-dropped)",
    },
  ];

  const serviceLabel =
    service === "all"
      ? t("misc.allServices")
      : service === SERVICE_NONE
        ? t("misc.noMatchingServiceACL")
        : service === SERVICE_RESPONSE
          ? t("misc.responseTraffic")
          : (serviceName ?? "");
  const zoneLabel = zone === "all" ? t("navigation.allZones") : zone;

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <span>{t("misc.filteringRatio")}</span>
          </CardTitle>
          <CardDescription className="mt-1">
            {zoneLabel} · {serviceLabel}
          </CardDescription>
        </div>
        <Select
          items={PERIODS}
          value={hours}
          onValueChange={(v) => v !== null && setHours(v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>

      {total === 0 ? (
        <EmptySheet />
      ) : (
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative h-60 w-60 shrink-0">
            <ChartContainer
              config={chartConfig}
              className="relative z-10 mx-auto aspect-square max-h-90 w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, _name, item) => {
                        const row = item.payload as {
                          id: "passed" | "dropped";
                          bytes: number;
                        };
                        const cfg = chartConfig[row.id];
                        return (
                          <div className="flex flex-1 items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2.5 w-2.5 shrink-0 rounded-full"
                                style={{ backgroundColor: cfg.color }}
                              />
                              <span className="text-muted-foreground">
                                {cfg.label}
                              </span>
                            </div>
                            <div className="grid gap-1 text-right font-mono">
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

            <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{blocked.toFixed(1)}%</span>
              <span className="text-sm text-muted-foreground">
                {t("misc.blocked")}
              </span>
            </div>
          </div>

          <ul className="grid grid-cols-2 gap-2 text-sm">
            {chartData.map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-xs"
                  style={{
                    backgroundColor:
                      chartConfig[d.id as "passed" | "dropped"].color,
                  }}
                />
                <span className="text-muted-foreground">
                  {chartConfig[d.id as "passed" | "dropped"].label}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
