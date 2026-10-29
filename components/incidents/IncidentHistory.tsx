"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { History } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ListPagination, { DEFAULT_PAGE_SIZE } from "@/components/shared/ListPagination";
import LogFilterBar, { DEFAULT_LOG_QUERY } from "@/components/shared/LogFilterBar";
import { useIncidentHistory } from "@/hooks/useIncidents";
import {
  formatBitrate,
  formatBytes,
  formatDateTime,
  formatDuration,
  formatNumber,
} from "@/lib/format";
import { incidentServiceLabel } from "@/lib/service-label";
import { incidentsService } from "@/service/incidents.service";

export default function IncidentHistory() {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(DEFAULT_LOG_QUERY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { data, isPending, isError, error, refetch, isFetching } =
    useIncidentHistory(query);

  const rows = data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(from, from + pageSize);

  return (
    <div className="space-y-5">
      <LogFilterBar
        query={query}
        onChange={(q) => {
          setQuery(q);
          setPage(1);
        }}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        onExport={(kind) => {
          window.location.href = incidentsService.exportUrl(kind, query, i18n.language);
        }}
      />

      {isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {error.message.startsWith("http.")
              ? t("misc.noConnectionWithServer")
              : error.message}
          </AlertDescription>
        </Alert>
      ) : !isPending && rows.length === 0 ? (
        <div className="py-12 text-center">
          <History className="text-muted-foreground mx-auto mb-4 size-14" />
          <p className="text-muted-foreground">{t("navigation.noIncidentsFound")}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("misc.tryAdjustingFilters")}
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("misc.time")}</TableHead>
                <TableHead>{t("navigation.zone2")}</TableHead>
                <TableHead>{t("misc.service2")}</TableHead>
                <TableHead>{t("misc.attacker")}</TableHead>
                <TableHead>{t("misc.target")}</TableHead>
                <TableHead>{t("misc.type2")}</TableHead>
                <TableHead>{t("misc.droppedPackets")}</TableHead>
                <TableHead>{t("misc.droppedBytes")}</TableHead>
                <TableHead>{t("misc.duration2")}</TableHead>
                <TableHead>{t("misc.droppedAvgPps")}</TableHead>
                <TableHead>{t("misc.droppedAvgBps")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-muted-foreground py-8 text-center">
                    {t("misc.loading")}
                  </TableCell>
                </TableRow>
              ) : (
                pageRows.map((inc, idx) => (
                  <TableRow key={`${from + idx}-${inc.attacker_ip}-${inc.start_time}`}>
                    <TableCell className="text-muted-foreground font-mono text-xs">
                      {formatDateTime(inc.start_time)}
                    </TableCell>
                    <TableCell className="font-semibold">{inc.zona_name || "—"}</TableCell>
                    <TableCell className="font-semibold text-amber-500">
                      {inc.service_name ? incidentServiceLabel(inc) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-orange-500">
                      {inc.attacker_ip || t("misc.unknown")}
                    </TableCell>
                    <TableCell className="font-mono text-blue-500">
                      {inc.zona_ip || t("misc.unknown")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{inc.attacker_type || t("misc.unknown")}</Badge>
                    </TableCell>
                    <TableCell className="text-destructive font-bold">
                      {formatNumber(inc.dropped_count)}
                    </TableCell>
                    <TableCell>{formatBytes(inc.dropped_byte)}</TableCell>
                    <TableCell className="font-semibold text-yellow-600 dark:text-yellow-500">
                      {formatDuration(inc.duration)}
                    </TableCell>
                    <TableCell>{formatNumber(inc.avg_pps)}</TableCell>
                    <TableCell>{formatBitrate(inc.avg_bps)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <ListPagination

            page={currentPage}

            pageSize={pageSize}

            total={rows.length}

            onPage={setPage}

            onPageSize={(n) => {

              setPageSize(n);

              setPage(1);

            }}

          />
        </>
      )}
    </div>
  );
}
