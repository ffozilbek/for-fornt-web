"use client";

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Activity,
  GraduationCap,
  Radar,
  ShieldAlert,
  TriangleAlert,
  UserX,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { useHttpsFloodStatus } from "@/hooks/useHttpsFlood";
import { cn } from "cn";
import { HTTPS_FLOOD_STATES, HttpsFloodService } from "@/types/dashboard";

// backend yuboradigan ma'lum sabablar tarjima qilinadi, qolgani o'zicha
const reasonText = (reason: string | undefined, t: TFunction) => {
  if (reason === "not started") return t("misc.notStarted");
  if (reason?.startsWith("l2fwd is not running"))
    return t("misc.l2fwdIsNotRunningOrItWasBuiltWithoutHTTP");
  return reason || t("misc.detectorStatusUnavailable");
};

function StateBadge({ state }: { state: number }) {
  const { t } = useTranslation();
  if (state === HTTPS_FLOOD_STATES.attack)
    return <Badge variant="destructive">{t("misc.mitigation")}</Badge>;
  if (state === HTTPS_FLOOD_STATES.detecting)
    return <Badge>{t("misc.learnDetect")}</Badge>;
  return <Badge variant="secondary">{t("misc.learning")}</Badge>;
}

function Tile({
  icon,
  label,
  value,
  className,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 rounded-lg border p-3", className)}>
      <div className="bg-muted flex size-9 shrink-0 items-center justify-center rounded-md">
        {icon}
      </div>
      <div>
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  );
}

const Sub = ({ children }: { children: ReactNode }) => (
  <div className="text-muted-foreground mt-0.5 text-xs">{children}</div>
);

// rate VA rv mezonlari birga yonib, yonib turishi kerak
function Criterion({ on, label, title }: { on: boolean; label: string; title: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={title}>
      <i
        className={cn(
          "inline-block size-2 rounded-full",
          on ? "bg-destructive" : "bg-muted-foreground/30",
        )}
      />
      {label}
    </span>
  );
}

function ServiceRow({ s }: { s: HttpsFloodService }) {
  const { t } = useTranslation();
  const attack = s.state === HTTPS_FLOOD_STATES.attack;

  return (
    <TableRow
      className={cn(attack && "bg-destructive/5", s.stale && "opacity-60")}
    >
      <TableCell>
        <b>{s.zone_name}</b> / {s.service_name}
        <Sub>
          {s.zone_ip}:443
          {s.stale && ` · ${t("misc.noTrafficForSecs", { sec: s.age_sec })}`}
        </Sub>
      </TableCell>
      <TableCell>
        <StateBadge state={s.state} />
      </TableCell>
      <TableCell className="min-w-40">
        <Progress value={s.state === HTTPS_FLOOD_STATES.learning ? s.learn_progress : 100} />
        <Sub>
          {s.state === HTTPS_FLOOD_STATES.learning
            ? t("misc.nTotalRequests", { n: s.learn_reqs, total: s.learn_target })
            : t("misc.baselineShortLongRps", { short: s.bl_short, long: s.bl_long })}
        </Sub>
      </TableCell>
      <TableCell className="font-semibold">{s.rps}</TableCell>
      <TableCell>
        {s.threshold}
        <Sub>{t("misc.longLongShortShort", { long: s.u_long, short: s.u_short })}</Sub>
      </TableCell>
      <TableCell>
        {s.rv_now < 0 ? "—" : s.rv_now}
        <Sub>
          {t("misc.baseBaseFiresTrigger", { base: s.rv_base, trigger: s.rv_trigger })}
        </Sub>
      </TableCell>
      <TableCell>
        <div className="flex gap-3">
          <Criterion on={s.rate_anom} label={t("misc.rate")} title={t("misc.rateCriterion")} />
          <Criterion on={s.rv_anom} label="RV" title={t("misc.relativeVarianceCriterion")} />
        </div>
        {attack ? (
          <Sub>
            {t("misc.attackSecsCalmQuietTarget", {
              sec: s.attack_duration,
              quiet: s.consec_quiet,
              target: s.quiet_target,
            })}
          </Sub>
        ) : (
          s.consec_anom > 0 && (
            <Sub>
              {t("misc.sustainedNTarget", { n: s.consec_anom, target: s.sustain_target })}
            </Sub>
          )
        )}
      </TableCell>
      <TableCell>
        {s.suspect_list.length > 0 ? (
          <div className="flex max-w-64 flex-wrap gap-1">
            {s.suspect_list.map((x) => (
              <Badge
                key={x.ip}
                variant="outline"
                className="font-mono"
                title={t("misc.rpsReqS", { rps: x.rps })}
              >
                {x.ip}
              </Badge>
            ))}
          </div>
        ) : (
          <Sub>{attack ? t("misc.noSourceMetBothCriteria") : "—"}</Sub>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function HttpsFloodStatus() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useHttpsFloodStatus();

  const available = !isError && data?.available;
  const sum = available ? data.summary : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <ShieldAlert size={20} />
          </div>
          <span>{t("misc.hTTPSProtection")}</span>
        </CardTitle>
        <CardDescription>
          {t("misc.tLS443FloodDetectionLearningStateBaselin")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {isPending ? (
          <CustomSkeleton />
        ) : (
          <>
            {!available && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertDescription>
                  {isError
                    ? t("misc.detectorStatusUnavailable")
                    : reasonText(data?.reason, t)}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <Tile icon={<Activity className="size-4" />} label={t("misc.Services")} value={sum?.total ?? "–"} />
              <Tile icon={<GraduationCap className="size-4" />} label={t("misc.learning")} value={sum?.learning ?? "–"} />
              <Tile icon={<Radar className="size-4" />} label={t("misc.learnDetect")} value={sum?.detecting ?? "–"} />
              <Tile
                icon={<ShieldAlert className="text-destructive size-4" />}
                label={t("misc.underAttack")}
                value={sum?.under_attack ?? "–"}
                className={sum?.under_attack ? "border-destructive/50" : undefined}
              />
              <Tile icon={<UserX className="size-4" />} label={t("misc.suspectIPs")} value={sum?.suspects ?? "–"} />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("navigation.zoneService")}</TableHead>
                  <TableHead>{t("misc.state")}</TableHead>
                  <TableHead>{t("misc.learning")}</TableHead>
                  <TableHead>{t("misc.requestsS")}</TableHead>
                  <TableHead>{t("misc.thresholdUT")}</TableHead>
                  <TableHead>{t("misc.relVariance")}</TableHead>
                  <TableHead>{t("misc.criteria")}</TableHead>
                  <TableHead>{t("misc.suspectSourceIPs")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!available || data.services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                      {available
                        ? t("misc.no443TrafficSeenYetAServiceAppearsHereAf")
                        : t("misc.noDetectorData")}
                    </TableCell>
                  </TableRow>
                ) : (
                  data.services.map((s) => (
                    <ServiceRow key={`${s.zone_ip}/${s.service_name}`} s={s} />
                  ))
                )}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  );
}
