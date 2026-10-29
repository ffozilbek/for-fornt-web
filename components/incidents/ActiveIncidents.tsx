"use client";

import { useTranslation } from "react-i18next";
import {
  Clock,
  Gauge,
  Hourglass,
  Network,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { useActiveIncidents } from "@/hooks/useIncidents";
import {
  formatBitrate,
  formatBytes,
  formatDateTime,
  formatDuration,
  formatNumber,
} from "@/lib/format";
import { incidentServiceLabel } from "@/lib/service-label";
import { ActiveIncident } from "@/types/dashboard";

function Stat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={className}>{value}</div>
    </div>
  );
}

function IncidentCard({ i }: { i: ActiveIncident }) {
  const { t } = useTranslation();
  const service = i.service_name ? incidentServiceLabel(i) : "";

  return (
    <Card className="border-destructive/40">
      <CardContent className="flex gap-4">
        <div className="flex-1 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="destructive">{t("misc.aCTIVE")}</Badge>
            <span className="font-semibold text-orange-500">
              {i.attack_type || t("misc.unknown")}
            </span>
            <span className="text-muted-foreground">→</span>
            <span className="font-semibold">{i.zona_name || i.dst_ip}</span>
            {service && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="font-semibold text-amber-500">{service}</span>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat
              label={t("misc.attacker")}
              value={i.src_ip || t("misc.unknown")}
              className="font-mono text-sm font-bold text-red-400"
            />
            <Stat
              label={t("misc.target")}
              value={i.dst_ip || t("misc.unknown")}
              className="font-mono text-sm font-bold text-blue-400"
            />
            <Stat
              label={t("misc.droppedPackets")}
              value={formatNumber(i.dropped_count)}
              className="text-destructive text-lg font-bold"
            />
            <Stat
              label={t("misc.droppedBytes")}
              value={formatBytes(i.dropped_bytes)}
              className="text-destructive text-lg font-bold"
            />
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {t("misc.started")} {formatDateTime(i.start_time)}
            </span>
            <span className="flex items-center gap-1 font-semibold text-yellow-600 dark:text-yellow-500">
              <Hourglass className="size-3.5" />
              {t("misc.duration")} {formatDuration(i.duration)}
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="size-3.5" />
              {t("misc.avgPps")} {formatNumber(i.avg_pps)}
            </span>
            <span className="flex items-center gap-1">
              <Network className="size-3.5" />
              {t("misc.avgBps")} {formatBitrate(i.avg_bps)}
            </span>
          </div>
        </div>
        <TriangleAlert className="text-destructive size-8 shrink-0" />
      </CardContent>
    </Card>
  );
}

export default function ActiveIncidents() {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useActiveIncidents();

  if (isPending) return <CustomSkeleton />;
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error.message.startsWith("http.")
            ? t("misc.noConnectionWithServer")
            : error.message}
        </AlertDescription>
      </Alert>
    );

  if (data.length === 0)
    return (
      <div className="py-12 text-center">
        <ShieldCheck className="mx-auto mb-4 size-14 text-green-500" />
        <p className="text-muted-foreground">{t("navigation.noActiveIncidents")}</p>
        <p className="text-muted-foreground mt-1 text-sm">{t("misc.systemIsSecure")}</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-3">
      {data.map((i) => (
        <IncidentCard key={`${i.src_ip}-${i.dst_ip}-${i.attack_type}`} i={i} />
      ))}
    </div>
  );
}
