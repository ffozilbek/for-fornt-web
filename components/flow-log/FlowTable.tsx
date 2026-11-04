"use client";

import { useState, type ReactNode } from "react";
import type { TFunction } from "i18next";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ListPagination, { DEFAULT_PAGE_SIZE } from "@/components/shared/ListPagination";
import Truncated from "@/components/shared/Truncated";
import { CountryCell, VerdictText } from "@/components/flow-log/FlowBits";
import { GROUP_LABEL } from "@/components/flow-log/FlowFilters";
import { cn } from "@/lib/utils";
import { fmtB, fmtInt, fmtTs, isFpGroup, isTlsGroup, type GroupBy } from "@/lib/flow-log";
import type { FlowGroupRow, FlowMitigationRow, FlowRow } from "@/types/dashboard";

// right — sonli ustunlar dashboard jadvallaridagidek o'ngga tekislanadi
// (oxirgi ustun doim o'ngda); className — audit loglaridagi uslub (vaqt, nom, IP)
export type Column<R> = { head: string; cell: (r: R) => ReactNode; right?: boolean; className?: string };

// audit loglari jadvalidagi uslublar
const TIME = "text-muted-foreground font-mono text-xs";
const ZONE = "font-semibold";
const SERVICE = "font-semibold text-amber-500";
const MONO = "font-mono";

const isRight = <R,>(columns: Column<R>[], i: number) => columns[i].right || i === columns.length - 1;

const bytesPkts = (b: number, p: number) => `${fmtB(b)}/${fmtInt(p)}`;

const keyHead = (by: GroupBy, t: TFunction) => (by === "country" ? t("misc.country") : GROUP_LABEL[by]);

// src IP yonida davlat bayrog'i; ja4/ja4t — barmoq izi, bayroqsiz
const keyCell = (by: GroupBy, key: string, country: string) =>
  by === "country" ? (
    <CountryCell code={key} />
  ) : by === "ip" ? (
    <span className="inline-flex items-center gap-2">
      {key}
      {country && <CountryCell code={country} />}
    </span>
  ) : (
    key || "—"
  );

const keyCls = (by: GroupBy) => (by === "country" ? undefined : MONO);

export const flowColumns = (t: TFunction, showTls: boolean): Column<FlowRow>[] => [
  { head: t("misc.time"), cell: (r) => fmtTs(r.ts), className: TIME },
  { head: t("navigation.zone").replace(":", ""), cell: (r) => r.zone_name, className: ZONE },
  { head: t("misc.service").replace(":", ""), cell: (r) => r.service_name, className: SERVICE },
  { head: t("misc.country"), cell: (r) => <CountryCell code={r.country} /> },
  { head: t("misc.src"), cell: (r) => `${r.src_ip}:${r.src_port}`, className: MONO },
  { head: t("misc.dst"), cell: (r) => `${r.dst_ip}:${r.dst_port}`, className: MONO },
  ...(showTls ? [{ head: "JA4", cell: (r: FlowRow) => r.ja4 || "—", className: MONO }] : []),
  { head: "JA4T", cell: (r) => r.ja4t || "—", className: MONO },
  ...(showTls ? [{ head: "SNI", cell: (r: FlowRow) => r.sni || "—" }] : []),
  { head: t("misc.durMs"), cell: (r) => fmtInt(r.duration_ms), right: true },
  { head: t("misc.fwdBPkts"), cell: (r) => bytesPkts(r.fwd_bytes, r.fwd_pkts), right: true },
  { head: t("misc.bwdBPkts"), cell: (r) => bytesPkts(r.bwd_bytes, r.bwd_pkts), right: true },
  { head: t("misc.end2"), cell: (r) => r.end_reason || "—" },
];

// ip / country / ja4t — TLS flowlar va SNI ro'yxati; ja4 / ja4t — davlatlar soni
export const groupColumns = (t: TFunction, by: GroupBy): Column<FlowGroupRow>[] => [
  { head: keyHead(by, t), cell: (r) => keyCell(by, r.key, r.country), className: keyCls(by) },
  { head: t("misc.flows"), cell: (r) => fmtInt(r.flows), right: true },
  { head: t("misc.srcIPs"), cell: (r) => fmtInt(r.src_ips), right: true },
  ...(isFpGroup(by) ? [{ head: t("misc.countries"), cell: (r: FlowGroupRow) => fmtInt(r.countries), right: true }] : []),
  ...(isTlsGroup(by)
    ? [
        { head: t("misc.tLSFlows"), cell: (r: FlowGroupRow) => fmtInt(r.tls_flows), right: true },
        {
          head: t("flowLog.snis"),
          cell: (r: FlowGroupRow) => (
            <Truncated max={3} items={r.snis.map((s) => <span key={s}>{s}</span>)} />
          ),
        },
      ]
    : []),
  { head: t("misc.fwdBPkts"), cell: (r) => bytesPkts(r.fwd_bytes, r.fwd_pkts), right: true },
  { head: t("misc.bwdBPkts"), cell: (r) => bytesPkts(r.bwd_bytes, r.bwd_pkts), right: true },
  { head: t("misc.lastSeen"), cell: (r) => fmtTs(r.last_ts), className: TIME },
];

export const driversText = (r: FlowMitigationRow) =>
  r.drivers.map((d) => `${d.feature} (${d.val})`).join(", ") || "—";

export const mitigationColumns = (t: TFunction, by: GroupBy): Column<FlowMitigationRow>[] => [
  { head: keyHead(by, t), cell: (r) => keyCell(by, r.key, r.country), className: keyCls(by) },
  ...(by !== "country" ? [{ head: t("misc.country"), cell: (r: FlowMitigationRow) => <CountryCell code={r.country} /> }] : []),
  ...(by !== "ip" ? [{ head: t("misc.srcIPs"), cell: (r: FlowMitigationRow) => fmtInt(r.uips), right: true }] : []),
  // DoA — hujum darajasi (yuqori = yomonroq)
  { head: "DoA", cell: (r) => <b>{r.score}</b>, right: true },
  { head: t("flowLog.verdict"), cell: (r) => <VerdictText verdict={r.verdict} /> },
  { head: t("flowLog.attackType"), cell: (r) => r.attack_type || "—" },
  { head: t("flowLog.window"), cell: (r) => r.window },
  { head: t("flowLog.peakFlows"), cell: (r) => fmtInt(r.peak_flows), right: true },
  { head: t("flowLog.flowPerSec"), cell: (r) => `${r.flow_rate.toLocaleString("en")}/s`, right: true },
  { head: t("flowLog.drivers"), cell: (r) => <span className="text-muted-foreground">{driversText(r)}</span> },
];

type Props<R> = {
  columns: Column<R>[];
  rows: R[];
  rowKey: (r: R, i: number) => string;
  onRow: (r: R) => void;
  empty: ReactNode;
};

// brauzer tomonida sahifalanadigan jadval; qatorni bosish — detal dialogi.
// Yangi natija kelganda sahifa birinchisiga qaytishi uchun chaqiruvchi key beradi
export default function FlowTable<R>({ columns, rows, rowKey, onRow, empty }: Props<R>) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>№</TableHead>
            {columns.map((c, ci) => (
              <TableHead key={c.head} className={isRight(columns, ci) ? "text-right" : undefined}>
                {c.head}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 1} className="text-muted-foreground py-6 text-center">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((r, i) => (
              <TableRow
                key={rowKey(r, (page - 1) * pageSize + i)}
                className="cursor-pointer"
                tabIndex={0}
                onClick={() => onRow(r)}
                onKeyDown={(e) => e.key === "Enter" && onRow(r)}
              >
                <TableCell className="font-medium">{(page - 1) * pageSize + i + 1}</TableCell>
                {columns.map((c, ci) => (
                  <TableCell
                    key={c.head}
                    className={cn(isRight(columns, ci) && "text-right", c.className)}
                  >
                    {c.cell(r)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {rows.length > 0 && (
        <ListPagination
          page={page}
          pageSize={pageSize}
          total={rows.length}
          onPage={setPage}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}
