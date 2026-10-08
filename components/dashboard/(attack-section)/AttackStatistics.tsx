"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { useTranslation } from "react-i18next";
import AttackStatCards from "./(attack-section-cards)/AttackStatCards";
import TopTenAttackerIPs from "./(attack-section-cards)/TopTenAttackerIPs";

export default function AttackStatsSection() {
  const { t } = useTranslation();

  const PERIODS = [
    { value: 1, label: t("misc.last1Hour") },
    { value: 6, label: t("misc.last6Hours") },
    { value: 24, label: t("misc.last24Hours") },
    { value: 168, label: t("misc.last7Days") },
  ];

  const [hours, setHours] = useState(PERIODS[0].value);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t("navigation.attackStatistics")}
        </h2>
        <Select
          items={PERIODS}
          value={hours}
          onValueChange={(v) => {
            if (v !== null) setHours(v);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <AttackStatCards hours={hours} />
      <div className="grid grid-cols-2 gap-5">
        <TopTenAttackerIPs hours={hours} />
        <TopTenAttackerIPs hours={hours} />
        <TopTenAttackerIPs hours={hours} />
        <TopTenAttackerIPs hours={hours} />
      </div>
    </section>
  );
}
