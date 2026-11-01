"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SimpleSelect } from "@/components/flow-log/CaptureBar";
import { toLocalInput } from "@/lib/format";
import {
  CUSTOM,
  DEFAULT_FILTERS,
  GROUP_BYS,
  LIMITS,
  activeFilterCount,
  type FlowFilters as Filters,
  type GroupBy,
} from "@/lib/flow-log";

const HOUR_MS = 3600_000;
const NONE = "none";

export const GROUP_LABEL: Record<GroupBy, string> = { ip: "Src IP", ja4: "JA4", ja4t: "JA4T", country: "Country" };

type Props = {
  value: Filters;
  onApply: (f: Filters) => void;
  rangeItems: { value: string; label: string }[];
  // TCP (TLS emas) servis tanlanganda SNI/JA4 maydonlari yashiriladi
  showTls: boolean;
};

const epochToInput = (sec: number) => (sec ? toLocalInput(new Date(sec * 1000)) : "");

// barcha jadval filtrlari bitta "Filtr" tugmasi ostidagi panelda;
// o'zgarishlar faqat "Apply" bosilganda qo'llanadi
export default function FlowFilters({ value, onApply, rangeItems, showTls }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const onOpenChange = (o: boolean) => {
    if (o) {
      // ochilganda joriy qo'llangan filtrlardan boshlanadi
      const now = Date.now();
      setDraft(value);
      setStart(epochToInput(value.start) || toLocalInput(new Date(now - HOUR_MS)));
      setEnd(epochToInput(value.end) || toLocalInput(new Date(now)));
      setError(null);
    }
    setOpen(o);
  };

  const apply = () => {
    let f = draft;
    if (f.range === CUSTOM) {
      if (!start || !end) return setError(t("misc.pleasePickBothStartAndEndDateTime"));
      const s = Math.floor(new Date(start).getTime() / 1000);
      const e = Math.floor(new Date(end).getTime() / 1000);
      if (e <= s) return setError(t("misc.endMustBeGreaterThanOrEqualToStart"));
      f = { ...f, start: s, end: e };
    }
    onApply(f);
    setOpen(false);
  };

  const clear = () => {
    onApply(DEFAULT_FILTERS);
    setOpen(false);
  };

  const text = (id: keyof Filters, label: string, placeholder: string, extra?: { upper?: boolean }) => (
    <Field>
      <FieldLabel htmlFor={`fl-f-${id}`}>{label}</FieldLabel>
      <Input
        id={`fl-f-${id}`}
        placeholder={placeholder}
        maxLength={extra?.upper ? 2 : undefined}
        className={extra?.upper ? "uppercase" : undefined}
        value={draft[id] as string}
        onChange={(e) => set(id, e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && apply()}
      />
    </Field>
  );

  const count = activeFilterCount(value);
  const nowInput = toLocalInput(new Date());

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger render={<Button variant="outline" />}>
        <Filter />
        {t("misc.filter")}
        {count > 0 && <Badge className="h-5 min-w-5 px-1.5">{count}</Badge>}
        <ChevronDown className="opacity-60" />
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-[70vh] w-80 gap-3 overflow-y-auto">
        {text("service", t("misc.filterService"), "service")}
        {showTls && text("sni", t("misc.sNIContains"), "example.com")}
        {showTls && text("ja4", t("misc.jA4Contains"), "t13d...")}
        {text("ja4t", t("flowLog.jA4TContains"), "64240_2-4-8...")}
        {text("srcIp", t("misc.srcIP"), "1.2.3.4")}
        {text("country", t("misc.country"), "US", { upper: true })}
        <Field>
          <FieldLabel htmlFor="fl-f-range">{t("misc.timeRange4")}</FieldLabel>
          <SimpleSelect
            id="fl-f-range"
            items={rangeItems}
            value={draft.range}
            onChange={(v) => set("range", v)}
            className="w-full"
          />
        </Field>
        {draft.range === CUSTOM && (
          <>
            <Field>
              <FieldLabel htmlFor="fl-f-start">{t("misc.started").replace(":", "")}</FieldLabel>
              <Input
                id="fl-f-start"
                type="datetime-local"
                step={60}
                max={nowInput}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fl-f-end">{t("misc.finished")}</FieldLabel>
              <Input
                id="fl-f-end"
                type="datetime-local"
                step={60}
                max={nowInput}
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </Field>
          </>
        )}
        <Field>
          <FieldLabel htmlFor="fl-f-group">{t("misc.groupBy")}</FieldLabel>
          <SimpleSelect
            id="fl-f-group"
            items={[
              { value: NONE, label: t("misc.noneFlows") },
              ...GROUP_BYS.map((g) => ({ value: g, label: g === "country" ? t("misc.country") : GROUP_LABEL[g] })),
            ]}
            value={draft.groupBy || NONE}
            onChange={(v) => set("groupBy", v === NONE ? "" : (v as GroupBy))}
            className="w-full"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="fl-f-limit">{t("misc.rows")}</FieldLabel>
          <SimpleSelect
            id="fl-f-limit"
            items={LIMITS.map((n) => ({ value: String(n), label: String(n) }))}
            value={String(draft.limit)}
            onChange={(v) => set("limit", Number(v))}
            className="w-full"
          />
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <div className="flex justify-end gap-2 border-t pt-3">
          <Button variant="outline" onClick={clear}>
            {t("misc.clear")}
          </Button>
          <Button onClick={apply}>{t("misc.apply")}</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
