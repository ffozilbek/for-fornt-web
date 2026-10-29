"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { formatBytes, formatNumber } from "@/lib/format";
import { SummaryDetail } from "@/types/dashboard";
import EmptySheet from "./EmptySheet";
import ListPagination, { DEFAULT_PAGE_SIZE } from "./ListPagination";

export function DataTable({ data }: { data: SummaryDetail }) {
  const { incidents } = data;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const { t } = useTranslation();

  const start = (page - 1) * pageSize;
  const pageRows = incidents.slice(start, start + pageSize);

  return (
    <>
      {incidents.length == 0 ? (
        <EmptySheet />
      ) : (
        <div className="space-y-5">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("misc.start2")}</TableHead>
                <TableHead>{t("misc.duration2")}</TableHead>
                <TableHead>{t("breakdowns.attackerIps")}</TableHead>
                <TableHead>{t("misc.type2")}</TableHead>
                <TableHead>{t("navigation.zone2")}</TableHead>
                <TableHead>{t("misc.service2")}</TableHead>
                <TableHead>{t("misc.packets")}</TableHead>
                <TableHead className="text-right">{t("misc.size")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows?.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.start}</TableCell>
                  <TableCell>{item.duration} s</TableCell>
                  <TableCell>{item.ip}</TableCell>
                  <TableCell>{item.type}</TableCell>
                  <TableCell>{item.zone}</TableCell>
                  <TableCell>{item.service}</TableCell>
                  <TableCell>{formatNumber(item.packets)}</TableCell>
                  <TableCell className="text-right">
                    {formatBytes(item.bytes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ListPagination
            page={page}
            pageSize={pageSize}
            total={incidents.length}
            onPage={setPage}
            onPageSize={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
        </div>
      )}
    </>
  );
}
