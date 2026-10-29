"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LucideIcon } from "lucide-react";
import { UseQueryResult } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import ListPagination, { DEFAULT_PAGE_SIZE } from "@/components/shared/ListPagination";
import LogFilterBar, { DEFAULT_LOG_QUERY } from "@/components/shared/LogFilterBar";
import { formatDateTime } from "@/lib/format";
import { formatServiceName } from "@/lib/service-label";
import { LogQuery, SecurityLog } from "@/types/dashboard";

type Props = {
  title: string;
  description?: string;
  icon: LucideIcon;
  // o'zgarmas hook bo'lishi shart (har renderda bir xil funksiya)
  useLogs: (query: LogQuery) => UseQueryResult<SecurityLog[]>;
  exportUrl: (kind: "csv" | "pdf", query: LogQuery, lang: string) => string;
  loadingText: string;
  empty: { icon: LucideIcon; iconClassName: string; title: string; hint: string };
};

// Xavfsizlik va audit loglari uchun umumiy karta: filtr paneli,
// vaqt/zona/servis/IP/xabar jadvali va brauzer tomonidagi sahifalash
export default function LogsCard({
  title,
  description,
  icon: Icon,
  useLogs,
  exportUrl,
  loadingText,
  empty,
}: Props) {
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState(DEFAULT_LOG_QUERY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { data, isPending, isError, error, refetch, isFetching } = useLogs(query);

  const rows = data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const from = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(from, from + pageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Icon size={20} />
          </div>
          <span>{title}</span>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5">
        <LogFilterBar
          query={query}
          onChange={(q) => {
            setQuery(q);
            setPage(1);
          }}
          onRefresh={() => refetch()}
          refreshing={isFetching}
          onExport={(kind) => {
            window.location.href = exportUrl(kind, query, i18n.language);
          }}
        />

        {isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              {t("navigation.errorLoadingLogs")}:{" "}
              {error.message.startsWith("http.")
                ? t("misc.noConnectionWithServer")
                : error.message}
            </AlertDescription>
          </Alert>
        ) : !isPending && rows.length === 0 ? (
          <div className="py-12 text-center">
            <empty.icon className={`mx-auto mb-4 size-14 ${empty.iconClassName}`} />
            <p className="text-muted-foreground">{empty.title}</p>
            <p className="text-muted-foreground mt-1 text-sm">{empty.hint}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("misc.time")}</TableHead>
                  <TableHead>{t("navigation.zoneName2")}</TableHead>
                  <TableHead>{t("misc.service2")}</TableHead>
                  <TableHead>{t("navigation.zoneIP")}</TableHead>
                  <TableHead>{t("misc.logMessage")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                      {loadingText}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageRows.map((log, idx) => (
                    <TableRow key={`${from + idx}-${log.time}`}>
                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {formatDateTime(log.time)}
                      </TableCell>
                      <TableCell className="font-semibold">{log.zona_name || "—"}</TableCell>
                      <TableCell className="font-semibold text-amber-500">
                        {log.service_name ? formatServiceName(log.service_name) : "—"}
                      </TableCell>
                      <TableCell className="font-mono">{log.zona_ip || "—"}</TableCell>
                      {/* uzun xabarlar qatorga bo'linadi, jadvalni kengaytirmaydi */}
                      <TableCell className="min-w-80 whitespace-normal break-words">
                        {log.log_message || "—"}
                      </TableCell>
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
      </CardContent>
    </Card>
  );
}
