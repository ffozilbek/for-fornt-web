"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownToLine, ChartColumn, ShieldCheck, ShieldX, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import LogFilterBar, { DEFAULT_LOG_QUERY } from "@/components/shared/LogFilterBar";
import SelectDisplayType from "@/components/shared/SelectDisplayType";
import StatCard from "@/components/shared/StatCard";
import StatisticsTrendChart from "@/components/statistics/StatisticsTrendChart";
import ProtocolBreakdownCard from "@/components/statistics/ProtocolBreakdownCard";
import DroppedByProtocolChart from "@/components/statistics/DroppedByProtocolChart";
import { useServices } from "@/hooks/useDashboard";
import { useStatistics } from "@/hooks/useStatistics";
import {
  bucketLabel,
  bucketize,
  formatValue,
  metric,
  serviceKind,
  summaryTotals,
  trendProtocols,
} from "@/lib/statistics";
import { statisticsService } from "@/service/statistics.service";

export default function GeneralStatistics() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(DEFAULT_LOG_QUERY);
  // jami kartochkalar birligi; grafiklarda o'z tanlovi bor
  const [type, setType] = useState("pps");
  const [protocol, setProtocol] = useState("all");
  const services = useServices(query.zone_name);
  const { data, isPending, isError, error, refetch, isFetching } = useStatistics(query);

  // grafikda bosilgan nuqta — shu javob uchungina amal qiladi,
  // yangi ma'lumot kelsa o'z-o'zidan bekor bo'ladi
  const [picked, setPicked] = useState<{ data: typeof data; index: number } | null>(null);

  const bits = type === "bits";
  const kind = serviceKind(query.service_name);
  const svc = services.data?.find((s) => s.serviceName === query.service_name);
  const protocols = trendProtocols(kind, svc);
  const proto = protocols.includes(protocol) ? protocol : protocols[0];

  const chart = useMemo(() => {
    if (!data) return null;
    const { start, end } = data.range;
    const { buckets, daily, rangeMin } = bucketize(data.stats, start, end);
    // maxsus oraliq, kun almashishi yoki 24-48 soat — vaqt sana bilan
    const withDate =
      "start_date" in query ||
      new Date(start).toDateString() !== new Date(end).toDateString() ||
      (rangeMin >= 1440 && rangeMin <= 2880);
    const labels = buckets.map((b) => bucketLabel(b.start, daily, withDate));
    return { buckets, labels };
    // query faqat data bilan birga o'zgaradi (javob shu so'rovniki)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const selected = picked && picked.data === data ? picked.index : null;
  const period = selected !== null ? chart?.buckets[selected] : undefined;
  const totals = useMemo(
    () => period?.totals ?? (data ? summaryTotals(data.summary) : {}),
    [period, data],
  );
  // "Other" servis trafigi faqat butun davr summary'sida bor
  const otherTraffic = period ? null : data?.summary.other_service_traffic;

  // CSV/PDF ustunlari servis protokoliga qarab cheklanadi
  const svcProto = kind === "specific" ? (svc?.protocol ?? "") : kind === "all" ? "All" : "-";

  const summaryCards = [
    {
      dir: "incoming",
      icon: <ArrowDownToLine size={20} />,
      label: t(bits ? "misc.totalIncomingBits" : "misc.totalIncomingPackets"),
    },
    {
      dir: "passed",
      icon: <ShieldCheck size={20} />,
      label: t(bits ? "misc.totalPassedBits" : "misc.totalPassedPackets"),
    },
    {
      dir: "dropped",
      icon: <ShieldX size={20} />,
      label: t(bits ? "misc.totalDroppedBits" : "misc.totalDroppedPackets"),
    },
  ] as const;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
              <ChartColumn size={20} />
            </div>
            <span>{t("navigation.generalStatistics")}</span>
          </CardTitle>
          <CardDescription>{t("navigation.trafficAnalysisAndZoneStatistics")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogFilterBar
            query={query}
            onChange={setQuery}
            onRefresh={() => refetch()}
            refreshing={isFetching}
            onExport={(k) => {
              window.location.href = statisticsService.exportUrl(k, query, svcProto, i18n.language);
            }}
            virtualServices
            extra={<SelectDisplayType value={type} onChange={setType} />}
          />
        </CardContent>
      </Card>

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message.startsWith("http.") ? t("misc.noConnectionWithServer") : error.message}
          </AlertDescription>
        </Alert>
      ) : isPending ? (
        <CustomSkeleton />
      ) : data.stats.length === 0 || !chart ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ChartColumn className="text-muted-foreground mx-auto mb-4 size-14" />
            <p className="text-muted-foreground">{t("navigation.noStatisticsAvailable")}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t("misc.tryAdjustingFilters")}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {period && selected !== null && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("misc.selected2")}</span>
              <span className="font-semibold">{chart.labels[selected]}</span>
              <Button size="sm" variant="ghost" onClick={() => setPicked(null)}>
                <X />
                {t("misc.clear")}
              </Button>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            {summaryCards.map((c) => (
              <StatCard
                key={c.dir}
                icon={c.icon}
                value={formatValue(metric(totals, proto, c.dir, bits), bits)}
                label={c.label}
              />
            ))}
          </div>

          <StatisticsTrendChart
            buckets={chart.buckets}
            labels={chart.labels}
            protocol={proto}
            protocols={protocols}
            onProtocol={setProtocol}
            selected={selected}
            onSelect={(index) => setPicked({ data, index })}
          />

          {/* aniq servis bitta protokolga tegishli — taqsimot ko'rsatilmaydi;
              qaytuvchi traffik drop qilinmaydi */}
          {kind !== "specific" && (
            <ProtocolBreakdownCard kind={kind} totals={totals} otherTraffic={otherTraffic} />
          )}
          {(kind === "all" || kind === "none") && (
            <DroppedByProtocolChart kind={kind} totals={totals} otherTraffic={otherTraffic} />
          )}
        </>
      )}
    </>
  );
}
