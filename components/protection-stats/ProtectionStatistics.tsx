"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import LogFilterBar, { DEFAULT_LOG_QUERY } from "@/components/shared/LogFilterBar";
import SelectDisplayType from "@/components/shared/SelectDisplayType";
import StatCard from "@/components/shared/StatCard";
import IndicatorPieChart from "@/components/protection-stats/IndicatorPieChart";
import IndicatorBarChart from "@/components/protection-stats/IndicatorBarChart";
import IndicatorTable from "@/components/protection-stats/IndicatorTable";
import { useProtectionStats } from "@/hooks/useProtectionStats";
import { SERVICE_NONE } from "@/lib/constants";
import { formatValue } from "@/lib/statistics";
import { indicatorLabel, indicatorList, topIndicators } from "@/lib/protection-stats";
import { protectionStatsService } from "@/service/protection-stats.service";

export default function ProtectionStatistics() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(DEFAULT_LOG_QUERY);
  // kartochkalar birligi; grafiklarda o'z tanlovi bor
  const [type, setType] = useState("pps");
  const { data, isPending, isError, error, refetch, isFetching } = useProtectionStats(query);

  const bits = type === "bits";
  const items = useMemo(() => (data ? indicatorList(data.summary.by_attack) : []), [data]);
  const totalPackets = data?.summary.total_dropped_count ?? 0;
  const totalBits = (data?.summary.total_dropped_byte ?? 0) * 8;
  const top = topIndicators(items, bits).top[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <span>{t("navigation.protectionStatistics")}</span>
          </CardTitle>
          <CardDescription>{t("navigation.statisticsOfTrafficBlockedByProtectionIn")}</CardDescription>
        </CardHeader>
        <CardContent>
          <LogFilterBar
            query={query}
            onChange={setQuery}
            onRefresh={() => refetch()}
            refreshing={isFetching}
            onExport={(k) => {
              window.location.href = protectionStatsService.exportUrl(k, query, i18n.language);
            }}
            virtualServices={[SERVICE_NONE]}
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
      ) : items.length === 0 || totalPackets === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="mx-auto mb-4 size-14 text-green-500" />
            <p className="text-muted-foreground">{t("misc.noDrops")}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              {t("misc.noDroppedPacketsInTheSelectedCondition")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2">
            <StatCard
              icon={<ShieldX size={20} />}
              value={formatValue(bits ? totalBits : totalPackets, bits)}
              label={t(bits ? "misc.totalDroppedBits" : "misc.totalDroppedPackets")}
            />
            <StatCard
              icon={<ShieldAlert size={20} />}
              value={top ? indicatorLabel(top.key, t) : "—"}
              label={t("misc.mostDroppedAttack")}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <IndicatorPieChart items={items} />
            <IndicatorBarChart items={items} />
          </div>

          <IndicatorTable items={items} totalPackets={totalPackets} totalBits={totalBits} />
        </>
      )}
    </>
  );
}
