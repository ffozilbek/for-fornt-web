"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useGeoCountries } from "@/hooks/useMitigationTemplates";
import { TemplateGeo } from "@/types/dashboard";

// qidiruv natijasida ko'pi bilan shuncha davlat ko'rsatiladi
const MAX_RESULTS = 100;

type Props = {
  id: string;
  mode: TemplateGeo["mode"];
  countries: string[];
  onChange: (patch: Partial<Pick<TemplateGeo, "mode" | "countries">>) => void;
};

export default function CountryPicker({ id, mode, countries, onChange }: Props) {
  const { t } = useTranslation();
  const all = useGeoCountries(true);
  const [query, setQuery] = useState("");

  const modeItems = [
    {
      value: "block",
      label: t("misc.blockTrafficFromSelectedCountriesIsBlock"),
    },
    { value: "allow", label: t("misc.allowOnlySelectedCountriesAreAllowed") },
  ];

  const nameOf = useMemo(() => {
    const map = new Map((all.data ?? []).map((c) => [c.code, c.name]));
    return (code: string) => map.get(code) || code;
  }, [all.data]);

  // tanlanganlar yuqoridagi chiplarda turadi, ro'yxatda takror chiqmaydi
  const q = query.trim().toLowerCase();
  const results = q
    ? (all.data ?? [])
        .filter(
          (c) =>
            !countries.includes(c.code) &&
            (c.code.toLowerCase().includes(q) ||
              (c.name ?? "").toLowerCase().includes(q)),
        )
        .sort((a, b) => (a.name || a.code).localeCompare(b.name || b.code))
        .slice(0, MAX_RESULTS)
    : [];

  const listHint = !q
    ? t("misc.typeInTheFieldAboveToSearchForACountry")
    : all.isPending
      ? t("misc.loading")
      : (all.data ?? []).length === 0
        ? t("misc.noCountriesFound")
        : results.length === 0
          ? t("misc.nothingFound")
          : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel>{t("misc.mode")}</FieldLabel>
          <Select
            items={modeItems}
            value={mode}
            onValueChange={(v) =>
              v && onChange({ mode: v as TemplateGeo["mode"] })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {modeItems.map((i) => (
                  <SelectItem key={i.value} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor={`${id}-search`}>
            {t("misc.searchCountry")}
          </FieldLabel>
          <Input
            id={`${id}-search`}
            value={query}
            placeholder={t("misc.eGRussiaRUChina")}
            onChange={(e) => setQuery(e.target.value)}
          />
        </Field>
      </div>

      <div className="bg-background flex min-h-10 flex-wrap gap-1.5 rounded-md border p-2">
        {countries.length === 0 ? (
          <span className="text-muted-foreground px-1 py-0.5 text-xs">
            {t("misc.noCountrySelected")}
          </span>
        ) : (
          countries.map((code) => (
            <Badge key={code} variant="secondary" className="gap-1 pr-1">
              <b>{code}</b>
              <span className="text-muted-foreground font-normal">
                {nameOf(code)}
              </span>
              <button
                type="button"
                className="hover:text-destructive cursor-pointer"
                title={t("misc.delete")}
                onClick={() =>
                  onChange({ countries: countries.filter((c) => c !== code) })
                }
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>

      <ul className="bg-background max-h-60 divide-y overflow-y-auto rounded-md border">
        {listHint ? (
          <li className="text-muted-foreground px-3 py-3 text-center text-xs">
            {listHint}
          </li>
        ) : (
          results.map((c) => (
            <li key={c.code}>
              <button
                type="button"
                className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-3 px-3 py-1.5 text-left text-xs"
                onClick={() => onChange({ countries: [...countries, c.code] })}
              >
                <Plus className="text-muted-foreground size-3.5 shrink-0" />
                <b className="w-8">{c.code}</b>
                <span className="text-muted-foreground flex-1">
                  {c.name || c.code}
                </span>
                <span className="text-muted-foreground">
                  {c.ip_count ?? 0} Subnet
                </span>
              </button>
            </li>
          ))
        )}
      </ul>
      <FieldDescription>
        {t("misc.selected")}: {countries.length}
      </FieldDescription>
    </div>
  );
}
