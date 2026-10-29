"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileDown, FileText, Filter, RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SelectZones from "@/components/shared/SelectZones";
import { useServices, useZones } from "@/hooks/useDashboard";
import { formatServiceProto } from "@/lib/service-label";
import { LogQuery } from "@/types/dashboard";

const CUSTOM = "custom";
const DEFAULT_HOURS = 5 / 60;

// boshlang'ich filtr: barcha zonalar, oxirgi 5 daqiqa
export const DEFAULT_LOG_QUERY: LogQuery = {
  zone_name: "all",
  service_name: "all",
  hours: DEFAULT_HOURS,
};

// datetime-local uchun lokal vaqt: YYYY-MM-DDTHH:MM
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

type Props = {
  query: LogQuery;
  onChange: (query: LogQuery) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onExport: (kind: "csv" | "pdf") => void;
};

// Incident tarixi va Xavfsizlik loglari uchun umumiy filtr paneli:
// zona, servis, davr (maxsus oraliq "Apply" bilan), yangilash, CSV/PDF eksport
export default function LogFilterBar({
  query,
  onChange,
  onRefresh,
  refreshing,
  onExport,
}: Props) {
  const { t } = useTranslation();
  const zones = useZones();
  const services = useServices(query.zone_name);

  const [rangeKey, setRangeKey] = useState(
    "hours" in query ? String(query.hours) : CUSTOM,
  );
  const [start, setStart] = useState("start_date" in query ? query.start_date : "");
  const [end, setEnd] = useState("end_date" in query ? query.end_date : "");
  const [rangeError, setRangeError] = useState<string | null>(null);

  const base = { zone_name: query.zone_name, service_name: query.service_name };
  const range =
    "hours" in query
      ? { hours: query.hours }
      : { start_date: query.start_date, end_date: query.end_date };

  const rangeItems = [
    { value: String(DEFAULT_HOURS), label: t("misc.last5Minutes") },
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

  const serviceItems = [
    { value: "all", label: t("misc.allServices") },
    ...(services.data ?? []).map((s) => ({
      value: s.serviceName,
      label: formatServiceProto(
        s.protocol,
        s.ports === "any" ? "" : s.ports,
        s.protocolNumber,
      ),
    })),
  ];

  // custom tanlanganda so'rov faqat "Apply" bosilganda o'zgaradi
  const changeRange = (v: string) => {
    setRangeKey(v);
    setRangeError(null);
    if (v === CUSTOM) {
      const now = new Date();
      if (!start) setStart(toLocalInput(new Date(now.getTime() - 3600_000)));
      if (!end) setEnd(toLocalInput(now));
      return;
    }
    onChange({ ...base, hours: Number(v) });
  };

  const applyCustom = () => {
    if (!start || !end) {
      setRangeError(t("misc.pleasePickBothStartAndEndDateTime"));
      return;
    }
    if (new Date(end) < new Date(start)) {
      setRangeError(t("misc.endMustBeGreaterThanOrEqualToStart"));
      return;
    }
    setRangeError(null);
    onChange({ ...base, start_date: start, end_date: end });
  };

  const nowInput = toLocalInput(new Date());

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SelectZones
          zones={zones.data ?? []}
          value={query.zone_name}
          onChange={(z) => onChange({ ...range, zone_name: z, service_name: "all" })}
        />
        <Select
          items={serviceItems}
          value={query.service_name}
          disabled={query.zone_name === "all"}
          onValueChange={(v) => v !== null && onChange({ ...range, ...base, service_name: v })}
        >
          <SelectTrigger className="w-full max-w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {serviceItems.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select items={rangeItems} value={rangeKey} onValueChange={(v) => v && changeRange(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {rangeItems.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} />
          {t("misc.refresh")}
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => onExport("csv")}>
            <FileDown />
            {t("misc.downloadCSV")}
          </Button>
          <Button variant="outline" onClick={() => onExport("pdf")}>
            <FileText />
            {t("misc.downloadPDF")}
          </Button>
        </div>
      </div>

      {rangeKey === CUSTOM && (
        <div className="flex flex-wrap items-end gap-3">
          <Field className="w-auto">
            <FieldLabel htmlFor="log-start">{t("misc.started")}</FieldLabel>
            <Input
              id="log-start"
              type="datetime-local"
              step={60}
              max={nowInput}
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field className="w-auto">
            <FieldLabel htmlFor="log-end">{t("misc.finished")}</FieldLabel>
            <Input
              id="log-end"
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
          {rangeError && <FieldError className="w-full">{rangeError}</FieldError>}
        </div>
      )}
    </div>
  );
}
