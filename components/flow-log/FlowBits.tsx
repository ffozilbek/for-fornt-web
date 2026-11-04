"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { fmtInt, num, type FlagSpec } from "@/lib/flow-log";

// ISO alpha-2 -> bayroq rasmi + kod; noma'lum kodda faqat matn qoladi
export function CountryCell({ code }: { code: string }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!code) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {code.length === 2 && failed !== code && (
        <Image
          src={`/flags/${code.toLowerCase()}.svg`}
          alt=""
          width={20}
          height={15}
          unoptimized
          className="h-3.75 w-5 rounded-none object-cover"
          onError={() => setFailed(code)}
        />
      )}
      {code}
    </span>
  );
}

export const Mono = ({ children }: { children: ReactNode }) => (
  <span className="font-mono break-all">{children || "—"}</span>
);

// detal dialogidagi "yorliq: qiymat" katakchalari
export function MetaGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-x-5 gap-y-3">
      {items.map(([label, value]) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5">
          <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
            {label}
          </span>
          <span className="text-sm wrap:anywhere">{value}</span>
        </div>
      ))}
    </div>
  );
}

function BarColumn({
  title,
  spec,
  row,
  color,
}: {
  title: string;
  spec: FlagSpec;
  row: object;
  color: string;
}) {
  const vals = spec.map(([label, k]) => [label, num(row, k)] as const);
  const total = vals.reduce((a, [, v]) => a + v, 0);
  const max = Math.max(1, ...vals.map(([, v]) => v));
  return (
    <div className="bg-muted/30 rounded-lg border p-4">
      <div className="mb-3 flex justify-between text-sm font-semibold">
        <span>{title}</span>
        <span className="text-muted-foreground font-normal">
          Σ {fmtInt(total)}
        </span>
      </div>
      {vals.map(([label, v]) => (
        <div
          key={label}
          className="my-2 grid grid-cols-[6rem_1fr_auto] items-center gap-2.5 text-xs"
        >
          <span className="font-mono opacity-80">{label}</span>
          <span className="bg-muted h-3.5 overflow-hidden rounded-full">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${v ? Math.max(2, (v / max) * 100) : 0}%`,
                background: color,
              }}
            />
          </span>
          <span className="min-w-20 text-right tabular-nums">
            {fmtInt(v)}{" "}
            <span className="text-muted-foreground">
              {total ? Math.round((v / total) * 100) : 0}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

type BarsProps = {
  row: object;
  client: { title: string; spec: FlagSpec; color: string };
  server: { title: string; spec: FlagSpec; color: string };
  empty: string;
  className?: string;
};

// ikki yo'nalishning TCP flag / TLS record taqsimoti (gorizontal ustunlar)
export function DirectionBars({
  row,
  client,
  server,
  empty,
  className,
}: BarsProps) {
  const sum = [...client.spec, ...server.spec].reduce(
    (a, [, k]) => a + num(row, k),
    0,
  );
  if (!sum) return <p className="text-muted-foreground text-xs">{empty}</p>;
  return (
    <div className={cn("grid gap-5 md:grid-cols-2", className)}>
      <BarColumn row={row} {...client} />
      <BarColumn row={row} {...server} />
    </div>
  );
}

export const VERDICT_CLS = {
  attack: "text-red-500",
  suspect: "text-yellow-600 dark:text-yellow-400",
  normal: "text-green-600 dark:text-green-400",
} as const;

export function VerdictText({
  verdict,
}: {
  verdict: keyof typeof VERDICT_CLS;
}) {
  const { t } = useTranslation();
  return (
    <span className={cn("text-xs font-bold uppercase", VERDICT_CLS[verdict])}>
      {t(`misc.${verdict}`)}
    </span>
  );
}
