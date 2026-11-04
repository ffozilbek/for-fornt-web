"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Play, Save, Square } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SelectZones from "@/components/shared/SelectZones";
import {
  useFlowLogRetention,
  useFlowLogStatus,
  useSetRetention,
  useStartCapture,
  useStopCapture,
} from "@/hooks/useFlowLog";
import { useZonesServices } from "@/hooks/useZones";
import { CAPTURE_MODES, FLOW_PROTOS, type CaptureMode } from "@/lib/flow-log";
import { formatServiceProto } from "@/lib/service-label";
import type { CaptureTarget } from "@/service/flow-log.service";
import type { Service, Zone } from "@/types/dashboard";

export function SimpleSelect({
  id,
  items,
  value,
  onChange,
  disabled,
  className,
}: {
  id?: string;
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Select items={items} value={value} disabled={disabled} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

const MODE_LABEL = {
  full: "misc.everyFlow",
  sample: "misc.sampling1N",
  new: "misc.onlyNewJA4SNI",
} as const;

type Props = {
  zones: Zone[];
  zone: string;
  onZone: (zone: string) => void;
  // zonaning to'liq servis ro'yxati — service_idx shu tartibdagi indeks (C tomoni)
  services: Service[];
  service: string;
  onService: (service: string) => void;
  notify: (text: string, error?: boolean) => void;
};

// zona/servis tanlovi, yozuvni boshlash/to'xtatish, saqlash muddati va faol yozuvlar
export default function CaptureBar({ zones, zone, onZone, services, service, onService, notify }: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<CaptureMode>("full");
  const [rate, setRate] = useState("10");
  const [days, setDays] = useState<string | null>(null);
  const [confirmStop, setConfirmStop] = useState<CaptureTarget | null>(null);

  const status = useFlowLogStatus();
  const retention = useFlowLogRetention();
  const setRetention = useSetRetention();
  const start = useStartCapture();
  const stop = useStopCapture();

  const slots = useMemo(() => status.data?.slots ?? [], [status.data]);
  const slotZones = useMemo(
    () => [...new Set(slots.map((s) => zones[s.zone_idx]?.zoneName).filter(Boolean))],
    [slots, zones],
  );
  const slotServices = useZonesServices(slotZones);

  const errText = (e: Error) => (e.message.startsWith("http.") ? t("misc.noConnectionWithServer") : e.message);

  // tanlangan (zona, servis) indekslari; "all" zona — yozib bo'lmaydi
  const zoneIdx = zones.findIndex((z) => z.zoneName === zone);
  const svcIdx = service === "all" ? -1 : services.findIndex((s) => s.serviceName === service);
  const valid = zoneIdx >= 0;
  // exact — aynan shu juftlik yozilmoqda; zoneWide — servis zonaning
  // "barcha servislar" yozuvi bilan allaqachon qamralgan
  const exact = valid && slots.some((s) => s.zone_idx === zoneIdx && s.service_idx === svcIdx);
  const zoneWide = valid && svcIdx >= 0 && !exact && slots.some((s) => s.zone_idx === zoneIdx && s.service_idx < 0);
  const recording = exact || zoneWide;

  const startTitle = !valid
    ? t("flowLog.selectZoneToCapture")
    : zoneWide
      ? t("flowLog.coveredByZoneRecording")
      : exact
        ? t("flowLog.recordingAlreadyRunning")
        : t("misc.startCapture");

  const doStart = () =>
    start.mutate(
      { zone_idx: zoneIdx, service_idx: svcIdx, mode, sample_rate: Math.max(2, Number(rate) || 10) },
      { onSuccess: () => notify(t("flowLog.captureStarted")), onError: (e) => notify(errText(e), true) },
    );

  const doStop = (target: CaptureTarget) =>
    stop.mutate(target, {
      onSuccess: () => notify(t("flowLog.captureStopped")),
      onError: (e) => notify(errText(e), true),
      onSettled: () => setConfirmStop(null),
    });

  // zona darajasidagi yozuvni to'xtatish zonaning barcha servislariga ta'sir qiladi
  const onStop = () =>
    zoneWide ? setConfirmStop({ zone_idx: zoneIdx, service_idx: -1 }) : doStop({ zone_idx: zoneIdx, service_idx: svcIdx });

  const daysValue = days ?? String(retention.data ?? "");
  const saveRetention = () => {
    const n = Number(daysValue);
    if (!Number.isInteger(n) || n < 1) return notify(t("misc.retentionMustBeAtLeast1Day"), true);
    setRetention.mutate(n, {
      onSuccess: (d) => {
        setDays(null);
        notify(t("flowLog.retentionSaved", { days: d }));
      },
      onError: (e) => notify(errText(e), true),
    });
  };

  const serviceItems = [
    { value: "all", label: t("misc.allServices") },
    ...services
      .filter((s) => FLOW_PROTOS.has(s.protocol))
      .map((s) => ({
        value: s.serviceName,
        label: formatServiceProto(s.protocol, s.ports === "any" ? "" : s.ports, s.protocolNumber),
      })),
  ];
  const modeItems = CAPTURE_MODES.map((m) => ({ value: m, label: t(MODE_LABEL[m]) }));

  const slotLabel = (zIdx: number, sIdx: number) => {
    const zName = zones[zIdx]?.zoneName;
    if (sIdx < 0) return `${zName ?? `zone ${zIdx}`} · ${t("misc.allServices")}`;
    const s = zName ? slotServices[zName]?.[sIdx] : undefined;
    return `${zName ?? `zone ${zIdx}`} · ${s ? formatServiceProto(s.protocol, s.ports === "any" ? "" : s.ports, s.protocolNumber) : `svc #${sIdx}`}`;
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field className="w-48">
          <FieldLabel>{t("navigation.zone").replace(":", "")}</FieldLabel>
          <SelectZones zones={zones} value={zone} onChange={onZone} />
        </Field>
        <Field className="w-48">
          <FieldLabel htmlFor="fl-service">{t("misc.service").replace(":", "")}</FieldLabel>
          <SimpleSelect
            id="fl-service"
            items={serviceItems}
            value={service}
            disabled={zone === "all"}
            onChange={onService}
            className="w-full"
          />
        </Field>
        <Field className="w-48">
          <FieldLabel htmlFor="fl-mode">{t("misc.mode")}</FieldLabel>
          <SimpleSelect
            id="fl-mode"
            items={modeItems}
            value={mode}
            onChange={(m) => setMode(m as CaptureMode)}
            className="w-full"
          />
        </Field>
        {mode === "sample" && (
          <Field className="w-24">
            <FieldLabel htmlFor="fl-rate">{t("flowLog.sampleRate")}</FieldLabel>
            <Input id="fl-rate" type="number" min={2} value={rate} onChange={(e) => setRate(e.target.value)} />
          </Field>
        )}
        <Button
          title={startTitle}
          disabled={!valid || recording || start.isPending}
          onClick={doStart}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          <Play />
          {t("misc.startCapture")}
        </Button>
        <Button variant="destructive" disabled={!valid || !recording || stop.isPending} onClick={onStop}>
          <Square />
          {t("misc.stop")}
        </Button>
        <Field className="w-auto">
          <FieldLabel htmlFor="fl-retention">{t("misc.retentionDays")}</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="fl-retention"
              type="number"
              min={1}
              className="w-20"
              value={daysValue}
              onChange={(e) => setDays(e.target.value)}
            />
            <Button variant="outline" disabled={setRetention.isPending} onClick={saveRetention}>
              <Save />
              {t("misc.save")}
            </Button>
          </div>
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {status.data?.error ? (
          <span className="text-destructive">{status.data.error}</span>
        ) : status.isError ? (
          <span className="text-destructive">{errText(status.error)}</span>
        ) : slots.length === 0 ? (
          <span className="text-muted-foreground">{t("misc.idle")}</span>
        ) : (
          slots.map((s) => (
            <span
              key={`${s.zone_idx}:${s.service_idx}`}
              className="inline-flex items-center gap-2 rounded-full bg-green-500/15 py-0.5 pr-1 pl-3 font-semibold text-green-700 dark:text-green-400"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
              {slotLabel(s.zone_idx, s.service_idx)} · {t(MODE_LABEL[CAPTURE_MODES[s.mode] ?? "full"])}
              {s.mode === 1 && ` ${s.sample_rate}`}
              <Button
                variant="destructive"
                size="xs"
                className="rounded-full"
                disabled={stop.isPending}
                onClick={() => doStop({ zone_idx: s.zone_idx, service_idx: s.service_idx })}
              >
                <Square />
                {t("misc.stop")}
              </Button>
            </span>
          ))
        )}
      </div>

      <AlertDialog open={confirmStop !== null} onOpenChange={(o) => !o && setConfirmStop(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("flowLog.stopZoneRecordingTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("flowLog.stopZoneRecordingDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("misc.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={stop.isPending}
              onClick={() => confirmStop && doStop(confirmStop)}
            >
              {t("misc.stop")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
