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
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptySheet from "./EmptySheet";

export function DataTable({ data }: { data: SummaryDetail }) {
  const { incidents } = data;
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const { t } = useTranslation();

  const totalPages = Math.max(1, Math.ceil(incidents.length / pageSize));

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
          <div className="flex items-center justify-between gap-4">
            <Field orientation="horizontal" className="w-fit">
              <FieldLabel htmlFor="select-rows-per-page">
                {t("misc.rows")}
              </FieldLabel>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-20" id="select-rows-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectGroup>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div>
                {t("misc.totalRows")} {incidents.length}
              </div>
            </Field>

            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={page === 1}
                    className={
                      page === 1 ? "pointer-events-none opacity-50" : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={page === totalPages}
                    className={
                      page === totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </>
  );
}
