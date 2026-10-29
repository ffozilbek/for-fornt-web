"use client";

import { useTranslation } from "react-i18next";
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
import { Field, FieldLabel } from "@/components/ui/field";

export const PAGE_SIZES = [10, 25, 50, 100];
export const DEFAULT_PAGE_SIZE = 25;

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  // sahifa hajmi o'zgarganda birinchi sahifaga qaytish chaqiruvchining ishi
  onPageSize: (size: number) => void;
};

// brauzer tomonidagi sahifalash: qatorlar soni tanlovi, jami son, oldingi/keyingi
export default function ListPagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: Props) {
  const { t } = useTranslation();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Field orientation="horizontal" className="w-fit">
        <FieldLabel htmlFor="rows-per-page">{t("misc.rows")}</FieldLabel>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => v && onPageSize(Number(v))}
        >
          <SelectTrigger className="w-20" id="rows-per-page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            <SelectGroup>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="whitespace-nowrap">
          {t("misc.totalRows")} {total}
        </div>
      </Field>

      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                onPage(Math.max(1, page - 1));
              }}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              aria-disabled={page === totalPages}
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              onClick={(e) => {
                e.preventDefault();
                onPage(Math.min(totalPages, page + 1));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
