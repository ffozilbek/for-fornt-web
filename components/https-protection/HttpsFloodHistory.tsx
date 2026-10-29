"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Filter, History } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useHttpsFloodHistory } from "@/hooks/useHttpsFlood";
import { formatDateTime } from "@/lib/format";
import { HttpsFloodHistoryQuery } from "@/types/dashboard";

const PAGE_SIZE = 10;
const CUSTOM = "custom";

const fmtDuration = (s: number) => {
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

// datetime-local uchun lokal vaqt: YYYY-MM-DDTHH:MM
const toLocalInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function HttpsFloodHistory() {
  const { t } = useTranslation();
  const [range, setRange] = useState("1");
  const [query, setQuery] = useState<HttpsFloodHistoryQuery>({ hours: 1 });
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const { data, isPending, isError } = useHttpsFloodHistory(query);

  const rangeItems = [
    { value: "1", label: t("misc.last1Hour") },
    { value: "24", label: t("misc.last24Hours") },
    { value: "168", label: t("misc.last7Days") },
    { value: "720", label: t("misc.last30Days") },
    { value: CUSTOM, label: t("misc.customRange") },
  ];

  const changeRange = (v: string) => {
    setRange(v);
    setRangeError(null);
    if (v === CUSTOM) {
      // default oraliq: oxirgi 1 soat; so'rov faqat "Apply" bosilganda
      const now = new Date();
      if (!start) setStart(toLocalInput(new Date(now.getTime() - 3600_000)));
      if (!end) setEnd(toLocalInput(now));
      return;
    }
    setQuery({ hours: Number(v) });
    setPage(1);
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
    setQuery({ start_date: start, end_date: end });
    setPage(1);
  };

  const available = !isError && data?.available;
  const rows = available ? data.attacks : [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * PAGE_SIZE;
  const pageRows = rows.slice(from, from + PAGE_SIZE);
  const nowInput = toLocalInput(new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <History size={20} />
          </div>
          <span>{t("misc.attackHistory")}</span>
          {available && (
            <Badge variant="secondary">
              {t("misc.nEventsIpsIPs", {
                n: data.count,
                ips: data.distinct_ips,
              })}
            </Badge>
          )}
        </CardTitle>
        <CardAction>
          <Select
            items={rangeItems}
            value={range}
            onValueChange={(v) => v && changeRange(v)}
          >
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
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        {range === CUSTOM && (
          <div className="flex flex-wrap items-end gap-3">
            <Field className="w-auto">
              <FieldLabel htmlFor="hf-start">{t("misc.started2")}</FieldLabel>
              <Input
                id="hf-start"
                type="datetime-local"
                step={60}
                max={nowInput}
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </Field>
            <Field className="w-auto">
              <FieldLabel htmlFor="hf-end">{t("misc.finished")}</FieldLabel>
              <Input
                id="hf-end"
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
            {rangeError && (
              <FieldError className="w-full">{rangeError}</FieldError>
            )}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("misc.started2")}</TableHead>
              <TableHead>{t("navigation.zoneService")}</TableHead>
              <TableHead>{t("misc.suspectSourceIP")}</TableHead>
              <TableHead>{t("misc.suspectRequests")}</TableHead>
              <TableHead>{t("misc.avgReqS")}</TableHead>
              <TableHead>{t("misc.duration2")}</TableHead>
              <TableHead>{t("misc.finished")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  {isPending
                    ? t("misc.loading")
                    : !available
                      ? t("misc.historyUnavailable")
                      : t("misc.noHTTPSFloodsRecordedInThisWindow")}
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((a) => (
                <TableRow
                  key={`${a.src_ip}-${a.zone_name}-${a.service_name}-${a.started}`}
                >
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(a.started)}
                  </TableCell>
                  <TableCell>
                    <b>{a.zone_name}</b> / {a.service_name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {a.src_ip}
                    </Badge>
                  </TableCell>
                  <TableCell>{a.suspect_requests.toLocaleString()}</TableCell>
                  <TableCell>{a.avg_rps}</TableCell>
                  <TableCell>{fmtDuration(a.duration)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(a.finished)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {rows.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">
              {t("misc.showingFromToOfTotalEvents", {
                from: from + 1,
                to: from + pageRows.length,
                total: rows.length,
              })}
            </span>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    className={
                      currentPage === 1 ? "pointer-events-none opacity-50" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(Math.max(1, currentPage - 1));
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === totalPages}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(Math.min(totalPages, currentPage + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
