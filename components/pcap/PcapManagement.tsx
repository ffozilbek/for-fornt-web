"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Filter, Info, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import SelectZones from "@/components/shared/SelectZones";
import { SimpleSelect } from "@/components/flow-log/CaptureBar";
import KindCard, { type KindSettings } from "@/components/pcap/KindCard";
import PcapFilesTable from "@/components/pcap/PcapFilesTable";
import { useServices, useZones } from "@/hooks/useDashboard";
import { useDeletePcap, usePcapFiles, usePcapStatus, useStartPcap, useStopPcap } from "@/hooks/usePcap";
import { toLocalInput } from "@/lib/format";
import { KIND_ID, PCAP_KINDS, filesParams, type PcapKind, type PcapRange } from "@/lib/pcap";
import { formatServiceProto } from "@/lib/service-label";
import type { PcapTarget } from "@/service/pcap.service";

const ALL = "all";
const CUSTOM = "custom";
const HOUR_MS = 3600_000;

const KIND_LABEL = {
  incoming: "misc.incoming",
  passed: "misc.passed",
  dropped: "misc.dropped",
  zoneall: "pcap.zoneInOut",
} as const;

export default function PcapManagement() {
  const { t } = useTranslation();
  const [zone, setZone] = useState(ALL);
  const [service, setService] = useState(ALL);
  const [kindFilter, setKindFilter] = useState<PcapKind | typeof ALL>(ALL);
  const [rangeKey, setRangeKey] = useState(ALL);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [custom, setCustom] = useState<PcapRange>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), message.error ? 4500 : 3500);
    return () => clearTimeout(id);
  }, [message]);
  const notify = (text: string, error?: boolean) => setMessage({ text, error });
  const errText = (e: Error) => (e.message.startsWith("http.") ? t("misc.noConnectionWithServer") : e.message);

  const zones = useZones();
  const services = useServices(zone);
  const zoneServices = useMemo(() => (zone === ALL ? [] : (services.data ?? [])), [zone, services.data]);
  const status = usePcapStatus();
  const startPcap = useStartPcap();
  const stopPcap = useStopPcap();
  const deletePcap = useDeletePcap();

  // C tomoni indekslar bilan ishlaydi: zona — /zones tartibi, servis — zona servislari tartibi
  const zoneIdx = (zones.data ?? []).findIndex((z) => z.zoneName === zone);
  const svcIdx = service === ALL ? -1 : zoneServices.findIndex((s) => s.serviceName === service);
  const svc = svcIdx >= 0 ? zoneServices[svcIdx] : undefined;
  // fayl nomiga servis yorlig'i yoziladi ("TCP 443" -> TCP_443), filtr ham shu bilan
  const svcLabel = svc ? formatServiceProto(svc.protocol, svc.ports === "any" ? "" : svc.ports, svc.protocolNumber) : "";

  const params = useMemo(() => {
    const range: PcapRange = rangeKey === ALL ? null : rangeKey === CUSTOM ? custom : { hours: Number(rangeKey) };
    return filesParams({ zone, serviceLabel: svcLabel, kind: kindFilter, range });
  }, [zone, svcLabel, kindFilter, rangeKey, custom]);
  const files = usePcapFiles(params);

  const captures = status.data?.zones ?? [];
  // zoneall slot doim service_idx = -1 bilan ochiladi
  const captureOf = (kind: PcapKind) =>
    captures.find(
      (c) =>
        c.zone_idx === zoneIdx &&
        c.service_idx === (kind === "zoneall" ? -1 : svcIdx) &&
        (c.kind_name === kind || c.kind === KIND_ID[kind]),
    ) ?? null;

  const kindName = (k: PcapKind) => t(KIND_LABEL[k]);

  const doStart = (kind: PcapKind, s: KindSettings) => {
    if (zoneIdx < 0) return notify(t("pcap.selectZoneFirst"), true);
    const zoneAll = kind === "zoneall";
    startPcap.mutate(
      {
        zone_idx: zoneIdx,
        zone_name: zone,
        service_idx: zoneAll ? -1 : svcIdx,
        service_name: zoneAll ? "" : svcLabel,
        kind,
        max_size: s.size,
        size_unit: s.unit,
        auto_stop: s.autoStop,
        max_files: s.maxFiles,
      },
      {
        onSuccess: () => notify(t("pcap.captureStarted", { kind: kindName(kind), zone })),
        onError: (e) => notify(errText(e), true),
      },
    );
  };

  const doStop = (target: PcapTarget) =>
    stopPcap.mutate(target, {
      onSuccess: (r) =>
        notify(`${t("pcap.captureStopped", { kind: kindName(target.kind) })}${r.filename ? `: ${r.filename}` : ""}`),
      onError: (e) => notify(errText(e), true),
    });

  const doDelete = (filename: string, done: () => void) =>
    deletePcap.mutate(filename, {
      onSuccess: () => notify(t("pcap.fileDeleted")),
      onError: (e) => notify(errText(e), true),
      onSettled: done,
    });

  const changeRange = (v: string) => {
    setRangeKey(v);
    setRangeError(null);
    if (v === CUSTOM) {
      const now = new Date();
      if (!start) setStart(toLocalInput(new Date(now.getTime() - HOUR_MS)));
      if (!end) setEnd(toLocalInput(now));
    }
  };

  const applyCustom = () => {
    if (!start || !end) return setRangeError(t("misc.pleasePickBothStartAndEndDateTime"));
    if (new Date(end) <= new Date(start)) return setRangeError(t("misc.endMustBeGreaterThanOrEqualToStart"));
    setRangeError(null);
    setCustom({ start_date: start, end_date: end });
  };

  const serviceItems = [
    { value: ALL, label: t("misc.allServices") },
    ...zoneServices.map((s) => ({
      value: s.serviceName,
      label: formatServiceProto(s.protocol, s.ports === "any" ? "" : s.ports, s.protocolNumber),
    })),
  ];
  const kindItems = [
    { value: ALL, label: t("misc.allTypes") },
    ...PCAP_KINDS.map((k) => ({ value: k, label: kindName(k) })),
  ];
  const rangeItems = [
    { value: ALL, label: t("misc.allTime") },
    { value: String(5 / 60), label: t("misc.last5Minutes") },
    { value: String(10 / 60), label: t("misc.last10Minutes") },
    { value: "0.5", label: t("misc.last30Minutes") },
    { value: "1", label: t("misc.last1Hour") },
    { value: "2", label: t("misc.last2Hours") },
    { value: "12", label: t("misc.last12Hours") },
    { value: "24", label: t("misc.last24Hours") },
    { value: "48", label: t("misc.last48Hours") },
    { value: "168", label: t("misc.last7Days") },
    { value: CUSTOM, label: t("misc.customRange") },
  ];
  const nowInput = toLocalInput(new Date());
  const statusError = status.data?.status === "error" ? (status.data.msg ?? "error") : null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent flex h-8 w-8 items-center justify-center rounded-md">
              <FileText size={20} />
            </div>
            <span>{t("misc.pcapManagement")}</span>
          </CardTitle>
          <CardDescription className="flex items-start gap-1.5">
            <Info size={14} className="mt-0.5 shrink-0" />
            <span>
              {t("misc.incomingPassedAndDroppedPacketsAreCaptur")} · {t("misc.filesOlderThan10DaysAreDeletedAutomatica")} ·{" "}
              {t("misc.recordingStopsWhenLessThan1GBOfDiskSpace")}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <Field className="w-48">
              <FieldLabel>{t("navigation.zone2")}</FieldLabel>
              <SelectZones
                zones={zones.data ?? []}
                value={zone}
                onChange={(z) => {
                  setZone(z);
                  setService(ALL);
                  setKindFilter(ALL);
                }}
              />
            </Field>
            <Field className="w-48">
              <FieldLabel htmlFor="pcap-service">{t("misc.serviceOptional")}</FieldLabel>
              <SimpleSelect
                id="pcap-service"
                items={serviceItems}
                value={service}
                disabled={zone === ALL}
                onChange={setService}
                className="w-full"
              />
            </Field>
            <Field className="w-48">
              <FieldLabel htmlFor="pcap-kind">{t("misc.fileType")}</FieldLabel>
              <SimpleSelect
                id="pcap-kind"
                items={kindItems}
                value={kindFilter}
                onChange={(v) => setKindFilter(v as PcapKind | typeof ALL)}
                className="w-full"
              />
            </Field>
            <Field className="w-48">
              <FieldLabel htmlFor="pcap-range">{t("misc.timeRange3")}</FieldLabel>
              <SimpleSelect id="pcap-range" items={rangeItems} value={rangeKey} onChange={changeRange} className="w-full" />
            </Field>
            {rangeKey === CUSTOM && (
              <>
                <Field className="w-auto">
                  <FieldLabel htmlFor="pcap-start">{t("misc.start2")}</FieldLabel>
                  <Input
                    id="pcap-start"
                    type="datetime-local"
                    step={60}
                    max={nowInput}
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </Field>
                <Field className="w-auto">
                  <FieldLabel htmlFor="pcap-end">{t("misc.end2")}</FieldLabel>
                  <Input
                    id="pcap-end"
                    type="datetime-local"
                    step={60}
                    max={nowInput}
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </Field>
                <Button onClick={applyCustom}>
                  <Filter />
                  {t("misc.apply")}
                </Button>
              </>
            )}
          </div>
          {rangeError && <FieldError>{rangeError}</FieldError>}
          {statusError && <p className="text-destructive text-xs">{statusError}</p>}
        </CardContent>
      </Card>

      {message && (
        <Alert variant={message.error ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      {status.data?.low_disk && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription>{t("pcap.lowDiskDetail", { free: status.data.free_human || "?" })}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PCAP_KINDS.map((kind) => (
          <KindCard
            // zona/servis almashsa sozlamalar default'ga qaytadi
            key={`${kind}:${zone}:${service}`}
            kind={kind}
            capture={captureOf(kind)}
            disabled={zoneIdx < 0}
            pending={startPcap.isPending || stopPcap.isPending}
            onStart={(s) => doStart(kind, s)}
            onStop={() => doStop({ zone_idx: zoneIdx, service_idx: kind === "zoneall" ? -1 : svcIdx, kind })}
            onInvalid={(msg) => notify(msg, true)}
          />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("misc.savedPcapFiles")}</CardTitle>
          <CardAction>
            <Button variant="outline" disabled={files.isFetching} onClick={() => files.refetch()}>
              <RefreshCw className={files.isFetching ? "animate-spin" : undefined} />
              {t("misc.refresh")}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {files.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errText(files.error)}</AlertDescription>
            </Alert>
          ) : files.isPending ? (
            <CustomSkeleton />
          ) : (
            <PcapFilesTable
              files={files.data}
              stopping={stopPcap.isPending}
              deleting={deletePcap.isPending}
              onStop={doStop}
              onDelete={doDelete}
            />
          )}
        </CardContent>
      </Card>
    </>
  );
}
