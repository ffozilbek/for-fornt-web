"use client";

import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ANOM,
  MIN_SAMPLES,
  domClass,
  type DomClass,
  type DomSide,
  type DomView,
  type Verdict,
} from "@/lib/tcp-indicators";

const CLS: Record<DomClass | "none", string> = {
  normal: "bg-green-500/15 text-green-600 dark:text-green-400",
  suspect: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  attack: "bg-red-500/15 text-red-600 dark:text-red-400",
  none: "bg-muted text-muted-foreground",
};
const BAR: Record<DomClass, string> = {
  normal: "bg-green-500",
  suspect: "bg-yellow-500",
  attack: "bg-red-500",
};

const winLabel = (label: string, t: TFunction) => (label === "window" ? t("misc.domWindow") : label);

function Pill({ cls, children }: { cls: DomClass | "none"; children: React.ReactNode }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide", CLS[cls])}>
      {children}
    </span>
  );
}

// oyna katakchasi: son — xulosa, low — namuna kam, null — trafik yo'q
function Cell({ v }: { v: Verdict }) {
  const { t } = useTranslation();
  if (v === null) return <Pill cls="none">—</Pill>;
  if (v === "low") return <Pill cls="none">{t("misc.low")}</Pill>;
  return <Pill cls={domClass(v)}>{v}%</Pill>;
}

function Badge({ label, side }: { label: string; side: DomSide }) {
  const { t } = useTranslation();
  const v = side.badge;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{label}</span>
      <b className="text-lg">{typeof v === "number" ? `${v}%` : "—"}</b>
      {typeof v === "number" ? (
        <Pill cls={domClass(v)}>{t(`misc.${domClass(v)}`)}</Pill>
      ) : (
        <Pill cls="none">{t(v === "low" ? "misc.lowData" : "misc.noTraffic")}</Pill>
      )}
    </div>
  );
}

// har belgining mu qiymati va xulosaga nima ta'sir qilgani
function Why({ title, side }: { title: string; side: DomSide }) {
  const { t } = useTranslation();
  const info = side.info;

  if (!info)
    return (
      <Card>
        <CardContent className="flex items-center gap-2 text-sm font-semibold">
          {title} <Pill cls="none">{t("misc.noTraffic")}</Pill>
        </CardContent>
      </Card>
    );

  const low = info.state === "low";
  const cls = domClass(info.dom);
  const drivers = info.parts.filter((p) => p.mu < ANOM).sort((a, b) => a.mu - b.mu);
  const reason = low
    ? `${t("misc.lowData2")} — N=${info.n} (< ${MIN_SAMPLES})`
    : info.dom >= 80
      ? t("misc.allFeaturesMatchTheBaseline")
      : drivers.length
        ? `${t("misc.drivenBy")} ${drivers.map((p) => `${t(`misc.${p.label}`)} (${p.val})`).join(", ")}`
        : t("misc.borderlineNoSingleDominantFeature");

  return (
    <Card>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          {title} —
          {low ? (
            <Pill cls="none">{t("misc.lowData")}</Pill>
          ) : (
            <Pill cls={cls}>
              {t(`misc.${cls}`)} {info.dom}%
            </Pill>
          )}
          <span className="text-muted-foreground ml-auto text-xs font-normal">
            N={info.n}
            {low ? ` (<${MIN_SAMPLES})` : ` · ${t("misc.worstWindow")} ${winLabel(side.label ?? "", t)}`}
          </span>
        </div>
        {info.parts.map((p) => {
          const pc = Math.round(p.mu * 100);
          return (
            <div
              key={p.label}
              className={cn(
                "grid grid-cols-[8rem_4rem_1fr_2.5rem] items-center gap-2 text-xs",
                !low && p.mu < ANOM && "text-red-500",
              )}
            >
              <span>{t(`misc.${p.label}`)}</span>
              <span className="text-right font-mono">{p.val}</span>
              <span className="bg-muted h-1.5 overflow-hidden rounded">
                <span className={cn("block h-full", BAR[domClass(pc)])} style={{ width: `${pc}%` }} />
              </span>
              <span className="text-muted-foreground text-right">{pc}%</span>
            </div>
          );
        })}
        <p className="text-muted-foreground border-t pt-2 text-xs">{reason}</p>
      </CardContent>
    </Card>
  );
}

// DoM natijalari: umumiy badge'lar, oynalar bo'yicha va tushuntirish
export default function DomPanel({ view, modeSelect }: { view: DomView | null; modeSelect: React.ReactNode }) {
  const { t } = useTranslation();
  const empty: DomSide = { badge: null, info: null, label: null };

  return (
    <>
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t("misc.doMBaseline")}</span>
              {modeSelect}
            </div>
            <div className="ml-auto flex flex-wrap gap-5">
              <Badge label={t("misc.clientDoM")} side={view?.client ?? empty} />
              <Badge label={t("misc.serverDoM")} side={view?.server ?? empty} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t pt-3 text-xs">
            <span className="text-muted-foreground">{t("misc.doMByWindow")}</span>
            {view ? (
              view.windows.map((w) => (
                <span key={w.label} className="inline-flex items-center gap-1.5">
                  <b className="text-muted-foreground min-w-7">{winLabel(w.label, t)}</b>
                  C <Cell v={w.c} /> S <Cell v={w.s} />
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Why title={t("misc.client")} side={view?.client ?? empty} />
        <Why title={t("misc.server")} side={view?.server ?? empty} />
      </div>
    </>
  );
}
