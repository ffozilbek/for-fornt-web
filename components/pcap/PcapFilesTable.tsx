"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, Square, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ListPagination, { DEFAULT_PAGE_SIZE } from "@/components/shared/ListPagination";
import { formatDateTime } from "@/lib/format";
import { kindById, type PcapKind } from "@/lib/pcap";
import { pcapService } from "@/service/pcap.service";
import type { PcapFile } from "@/types/dashboard";

type Props = {
  files: PcapFile[];
  stopping: boolean;
  deleting: boolean;
  onStop: (target: { zone_idx: number; service_idx: number; kind: PcapKind }) => void;
  onDelete: (filename: string, done: () => void) => void;
};

// yozilayotgan faylda zone_idx/service_idx/kind_id bo'lsa — shu yerdan to'xtatish
const stopTarget = (f: PcapFile) => {
  const kind = f.kind_id === undefined ? undefined : kindById(f.kind_id);
  return f.recording && f.zone_idx !== undefined && f.service_idx !== undefined && kind
    ? { zone_idx: f.zone_idx, service_idx: f.service_idx, kind }
    : null;
};

export default function PcapFilesTable({ files, stopping, deleting, onStop, onDelete }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(files.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageRows = files.slice(start, start + pageSize);

  return (
    <div className="space-y-5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>№</TableHead>
            <TableHead>{t("misc.fileName")}</TableHead>
            <TableHead>{t("navigation.zone2")}</TableHead>
            <TableHead className="text-right">{t("misc.size")}</TableHead>
            <TableHead>{t("misc.status")}</TableHead>
            <TableHead>{t("misc.time")}</TableHead>
            <TableHead className="text-right">{t("misc.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-6 text-center">
                {t("pcap.noFiles")}
              </TableCell>
            </TableRow>
          ) : (
            pageRows.map((f, i) => {
              const target = stopTarget(f);
              return (
                <TableRow key={f.filename}>
                  <TableCell className="font-medium">{start + i + 1}</TableCell>
                  <TableCell className="max-w-md truncate font-mono" title={f.filename}>
                    {f.filename}
                  </TableCell>
                  <TableCell className="font-semibold">{f.zone_name}</TableCell>
                  <TableCell className="text-right">{f.size_human}</TableCell>
                  <TableCell>
                    {f.recording ? (
                      <Badge className="gap-1.5 bg-red-500/15 text-red-600 dark:text-red-400">
                        <span className="size-1.5 animate-pulse rounded-full bg-red-500" />
                        {t("misc.rECORDING")}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">{t("misc.ready")}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
{formatDateTime(f.modified)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1.5">
                      {target && (
                        <Button variant="destructive" size="sm" disabled={stopping} onClick={() => onStop(target)}>
                          <Square />
                          {t("misc.stop")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (window.location.href = pcapService.downloadUrl(f.filename))}
                      >
                        <Download />
                        {t("misc.download")}
                      </Button>
                      {/* yozilayotgan faylni o'chirib bo'lmaydi — avval Stop */}
                      {!f.recording && (
                        <Button variant="outline" size="sm" onClick={() => setToDelete(f.filename)}>
                          <Trash2 className="text-destructive" />
                          {t("misc.delete")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {files.length > 0 && (
        <ListPagination
          page={current}
          pageSize={pageSize}
          total={files.length}
          onPage={setPage}
          onPageSize={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pcap.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="break-all">
              {t("pcap.deleteDesc", { name: toDelete ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("misc.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={() => toDelete && onDelete(toDelete, () => setToDelete(null))}
            >
              {t("misc.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
