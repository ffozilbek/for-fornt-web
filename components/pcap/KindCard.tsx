"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowLeftRight,
  Ban,
  CircleCheck,
  Play,
  Square,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleSelect } from "@/components/flow-log/CaptureBar";
import {
  SIZE_UNITS,
  humanSize,
  type PcapKind,
  type SizeUnit,
} from "@/lib/pcap";
import type { PcapCapture } from "@/types/dashboard";

export type KindSettings = {
  size: number;
  unit: SizeUnit;
  autoStop: boolean;
  maxFiles: number;
};

const META = {
  incoming: { icon: ArrowDown, color: "bg-blue-600", label: "misc.incoming" },
  passed: { icon: CircleCheck, color: "bg-green-600", label: "misc.passed" },
  dropped: { icon: Ban, color: "bg-rose-600", label: "misc.dropped" },
  zoneall: {
    icon: ArrowLeftRight,
    color: "bg-purple-600",
    label: "pcap.zoneInOut",
  },
} as const;

type Props = {
  kind: PcapKind;
  capture: PcapCapture | null;
  // zona tanlanmagan yoki so'rov ketmoqda
  disabled: boolean;
  pending: boolean;
  onStart: (s: KindSettings) => void;
  onStop: () => void;
  onInvalid: (msg: string) => void;
};

// bitta kind (incoming / passed / dropped / zoneall) uchun yozish sozlamalari va holati.
// Zona/servis almashganda chaqiruvchi key orqali inputlarni default'ga qaytaradi
export default function KindCard({
  kind,
  capture,
  disabled,
  pending,
  onStart,
  onStop,
  onInvalid,
}: Props) {
  const { t } = useTranslation();
  const [size, setSize] = useState("");
  const [unit, setUnit] = useState<SizeUnit>("MB");
  const [autoStop, setAutoStop] = useState(false);
  const [files, setFiles] = useState("");

  const { icon: Icon, color, label } = META[kind];
  const recording = capture !== null;
  const filesN = files.trim() === "" ? 0 : Number(files);
  // fayllar soni >= 1 bo'lsa yozish o'zi to'xtaydi — auto-stop kerak emas
  const hasCount = Number.isFinite(filesN) && filesN >= 1;

  const start = () => {
    const sizeN = Math.max(0, Math.floor(Number(size) || 0));
    if (!Number.isInteger(filesN))
      return onInvalid(t("misc.fileCountMustBeAnInteger"));
    if (filesN < 0) return onInvalid(t("misc.fileCountCannotBeNegative"));
    // rotatsiya uchun fayl hajmi kerak
    if (filesN >= 1 && sizeN <= 0)
      return onInvalid(t("misc.fileSizeIsRequiredWhenFileCountIsSet"));
    if (autoStop && filesN < 1 && sizeN <= 0)
      return onInvalid(t("misc.setAFileSizeForAutoStop"));
    onStart({
      size: sizeN,
      unit,
      autoStop: autoStop && !hasCount,
      maxFiles: filesN,
    });
  };

  let meta = "—";
  if (capture) {
    let limit = "";
    if (capture.max_size > 0)
      limit =
        capture.max_files >= 1
          ? ` / ${humanSize(capture.max_size)} × ${t("pcap.filesProgress", { n: capture.file_count || 1, max: capture.max_files })}`
          : ` / max ${humanSize(capture.max_size)} (${capture.auto_stop ? "auto-stop" : "rotate"})`;
    const part =
      capture.part_idx > 0
        ? ` · ${t("pcap.part", { n: capture.part_idx })}`
        : "";
    meta = `${t("misc.current2")} ${humanSize(capture.current_size)}${limit}${part}`;
  }

  const locked = recording || pending;

  return (
    <Card className="">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <div className={`${color} p-1 rounded-md`}>
              <Icon size={18} className="text-white" />
            </div>
            {t(label)}
          </span>
          {recording ? (
            <Badge className="gap-1.5 bg-red-500/15 text-red-600 dark:text-red-400">
              <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
              {t("misc.recording")}
            </Badge>
          ) : (
            <Badge variant="secondary">{t("misc.ready")}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {kind === "zoneall" && (
          <p
            className="text-muted-foreground text-xs"
            title={t("pcap.zoneInOutTitle")}
          >
            {t("pcap.zoneInOutHint")}
          </p>
        )}
        <Field>
          <FieldLabel htmlFor={`pcap-size-${kind}`}>
            {t("misc.fileSize0NoLimit")}
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              id={`pcap-size-${kind}`}
              type="number"
              min={0}
              placeholder="0"
              disabled={locked}
              value={size}
              onChange={(e) => setSize(e.target.value)}
            />
            <SimpleSelect
              items={SIZE_UNITS.map((u) => ({ value: u, label: u }))}
              value={unit}
              disabled={locked}
              onChange={(u) => setUnit(u as SizeUnit)}
              className="w-20"
            />
          </div>
        </Field>
        <Field>
          <FieldLabel htmlFor={`pcap-files-${kind}`}>
            {t("misc.fileCount0Unlimited")}
          </FieldLabel>
          <Input
            id={`pcap-files-${kind}`}
            type="number"
            min={0}
            placeholder="0"
            disabled={locked}
            value={files}
            onChange={(e) => setFiles(e.target.value)}
          />
        </Field>
        <Label className="cursor-pointer font-normal">
          <Checkbox
            checked={autoStop && !hasCount}
            disabled={locked || hasCount}
            onCheckedChange={(c) => setAutoStop(c)}
          />
          {t("misc.autoStopStopWritingAtSizeLimit")}
        </Label>
        <p className="text-muted-foreground mt-auto font-mono text-xs">
          {meta}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            disabled={disabled || locked}
            onClick={start}
          >
            <Play />
            {t("pcap.start")}
          </Button>
          <Button
            variant="destructive"
            disabled={disabled || !recording || pending}
            onClick={onStop}
          >
            <Square />
            {t("misc.stop")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
