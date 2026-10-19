"use client";

import CustomSkeleton from "@/components/shared/CustomSkeleton";
import { DataTable } from "@/components/shared/DataTable";
import StatCard from "@/components/shared/StatCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBytes, formatNumber } from "@/lib/format";
import { DetailTarget } from "@/types/dashboard";
import { FileUser, Gauge, RotateCcwClock, StickyNote } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptySheet from "@/components/shared/EmptySheet";
import BlockedPacketsDetail from "@/components/shared/BlockedPacketsDetail";
import IndicatorDetail from "@/components/shared/IndicatorDetail";
import { useDetail } from "@/hooks/useDashboard";
import Image from "next/image";

export default function SummaryDetailView({
  target,
  hours,
}: {
  target: DetailTarget;
  hours: number;
}) {
  const { data, isPending, isError, error } = useDetail(target, {
    hours,
    zone: "all",
  });

  const { t } = useTranslation();

  if (isPending) {
    return <CustomSkeleton />;
  }
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  console.log(data);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-secondary-foreground flex items-center gap-3">
            {data.header.country_code && (
              <Image
                src={`/flags/${data.header.country_code}.svg`}
                alt={data.header.country_code || ""}
                width={40}
                height={40}
                unoptimized
              />
            )}
            {data.header.key && (
              <span>
                {t(`headers.${data.header.key}.title`, {
                  defaultValue: data.header.title,
                })}
              </span>
            )}
          </CardTitle>
          {data.header.subtitle && (
            <CardDescription>
              {t(`headers.${data.header.key}.subtitle`, {
                defaultValue: data.header.subtitle,
              })}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <p>
              {t("misc.droppedPackets")}:{" "}
              {formatNumber(data.totals.dropped_packets)}
            </p>
            <p>
              {t("misc.droppedBytes")}: {formatBytes(data.totals.dropped_bytes)}
            </p>
          </div>
          {data.totals.first_seen && data.totals.last_seen && (
            <div className="text-end">
              <p>
                {t("misc.start")} {data.totals.first_seen}{" "}
              </p>
              <p>
                {t("misc.end")} {data.totals.last_seen}{" "}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      {data.totals.attackers > 0 &&
        data.totals.peak_bps > 0 &&
        data.totals.peak_pps > 0 &&
        data.totals.incidents > 0 && (
          <div className="grid grid-cols-4 gap-5">
            <StatCard
              icon={<RotateCcwClock size={18} />}
              value={formatNumber(data.totals.incidents)}
              label={t("navigation.recordedIncidents")}
            ></StatCard>
            <StatCard
              icon={<Gauge size={18} />}
              value={formatNumber(data.totals.peak_bps)}
              label={t("misc.peakBps")}
            ></StatCard>
            <StatCard
              icon={<StickyNote size={18} />}
              value={formatNumber(data.totals.peak_pps)}
              label={t("misc.peakPps")}
            ></StatCard>
            <StatCard
              icon={<FileUser size={18} />}
              value={formatNumber(data.totals.attackers)}
              label={t("misc.attackers")}
            ></StatCard>
          </div>
        )}

      {data.breakdowns[0].label === "Hujum turlari" &&
        data.breakdowns[1].label === "Nishondagi zonalar" && (
          <div className="grid grid-cols-2 gap-5">
            {/* ATTACK TYPES */}
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  {t("misc.attackTypes")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.breakdowns[0].items.length == 0 ? (
                  <EmptySheet />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>№</TableHead>
                        <TableHead>{t("misc.attackTypes")}</TableHead>
                        <TableHead>{t("navigation.incidents")}</TableHead>
                        <TableHead className="text-right">
                          {t("misc.packets")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.breakdowns[0].items.map((attack, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell>{attack.name}</TableCell>
                          <TableCell>{attack.incidents}</TableCell>
                          <TableCell className="text-right">
                            {formatNumber(attack.packets)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* TARGET ZONES */}
            <Card>
              <CardHeader>
                <CardTitle className="text-muted-foreground">
                  {t("breakdowns.targetZones")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.breakdowns[1].items.length == 0 ? (
                  <EmptySheet />
                ) : (
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
                      {data.breakdowns[1].items.map((zone, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell>{zone.name}</TableCell>
                          <TableCell>{zone.incidents}</TableCell>
                          <TableCell className="text-right">
                            {formatNumber(zone.packets)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      {data.incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-muted-foreground">
              <span>{t("navigation.incidents")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable data={data} />
          </CardContent>
        </Card>
      )}

      {data.breakdowns[0].label === "Protokollar" && (
        <BlockedPacketsDetail data={data} />
      )}

      {data.breakdowns[0].label === "Himoya indikatorlari" && (
        <IndicatorDetail data={data} />
      )}
    </>
  );
}
