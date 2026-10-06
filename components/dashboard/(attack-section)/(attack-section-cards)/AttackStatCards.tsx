/* eslint-disable @typescript-eslint/no-explicit-any */

import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttackSummary } from "@/hooks/useDashboard";
import { formatBytes, formatNumber } from "@/lib/format";
import { ReactNode } from "react";
import { FileUser, RotateCcwClock, ShieldCog, ShieldX } from "lucide-react";
import { useTranslation } from "react-i18next";

function StatCard({
  hour,
  icon,
  value,
  label,
  hint,
}: {
  hour: string;
  icon: ReactNode;
  value: ReactNode;
  label: string;
  hint?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
          {icon}
          <span>{hour}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export default function AttackStatCards({ hours }: { hours: number }) {
  const { data, isPending, isError, error, isPlaceholderData } =
    useAttackSummary({ hours, zone: "all" });

  const { t } = useTranslation();

  const cardTime =
    hours > 24 ? t("misc.last7Days") : `${hours} ${t("misc.hOURS")}`;

  return (
    <>
      {isPending ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CustomSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : (
        <div
          className={`grid gap-4 md:grid-cols-2 xl:grid-cols-4 ${
            isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          <StatCard
            hour={cardTime}
            icon={<RotateCcwClock size={18} />}
            value={formatNumber(data.totals.incidents)}
            label={t("navigation.recordedIncidents")}
          />
          <StatCard
            hour={cardTime}
            icon={<FileUser size={18} />}
            value={
              <span className="text-red-400">
                {formatNumber(data.totals.attackers)}
              </span>
            }
            label={t("misc.uniqueAttackerIPs")}
          />
          <StatCard
            hour={cardTime}
            icon={<ShieldX size={18} />}
            value={
              <span className="text-red-400">
                {formatNumber(data.dropped.totals.packets)}
              </span>
            }
            label={t("misc.blockedPackets")}
            hint={formatBytes(data.dropped.totals.bytes)}
          />
          <StatCard
            hour={cardTime}
            icon={<ShieldCog size={18} />}
            value={
              <span className="text-lg">
                {t(`misc.${data.top_indicator.name}` as any)}
              </span>
            }
            label={t("misc.mostActiveProtectionIndicator")}
            hint={`${formatNumber(data.top_indicator.packets)} ${t("misc.packets")} · ${data.top_indicator.share}%`}
          />
        </div>
      )}
    </>
  );
}
