"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Plus, RefreshCw, Search, Shield, Trash2 } from "lucide-react";
import {
  Card,
  CardAction,
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import EmptySheet from "@/components/shared/EmptySheet";
import Truncated from "@/components/shared/Truncated";
import {
  useDeleteTemplate,
  useMitigationTemplates,
} from "@/hooks/useMitigationTemplates";
import { formatDateTime } from "@/lib/format";
import { TEMPLATE_TYPES, templateTypeLabel } from "@/lib/mitigation-templates";
import { MitigationTemplate } from "@/types/dashboard";
import TemplateFormDialog from "./TemplateFormDialog";

const PAGE_SIZE = 10;
const MAX_ZONES_SHOWN = 2;

// dialog: null — yopiq, { template: undefined } — yaratish
type DialogState = { template?: MitigationTemplate } | null;

export default function TemplateTable() {
  const { t } = useTranslation();
  const { data: templates, isPending, isError, error, refetch, isFetching } =
    useMitigationTemplates();
  const deleteTemplate = useDeleteTemplate();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toDelete, setToDelete] = useState<MitigationTemplate | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error?: boolean;
  } | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), message.error ? 4500 : 3500);
    return () => clearTimeout(id);
  }, [message]);

  const typeItems = [
    { value: null as string | null, label: t("misc.allTypes") },
    ...TEMPLATE_TYPES.map((tt) => ({
      value: tt as string | null,
      label: templateTypeLabel(tt, t),
    })),
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (templates ?? []).filter(
      (tpl) =>
        (!typeFilter || tpl.templateType === typeFilter) &&
        (!q || tpl.templateName.toLowerCase().includes(q)),
    );
  }, [templates, search, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  const onSaved = (edited: boolean) =>
    setMessage({
      text: edited ? t("misc.templateUpdated") : t("misc.templateCreated"),
    });

  // ishlatilayotgan shablonni backend o'chirmaydi — xabari ko'rsatiladi
  const confirmDelete = () => {
    if (!toDelete) return;
    deleteTemplate.mutate(toDelete.templateName, {
      onSuccess: () => setMessage({ text: t("misc.templateDeleted") }),
      onError: (err) =>
        setMessage({
          error: true,
          text: err.message.startsWith("http.")
            ? t("misc.noConnectionWithServer")
            : err.message,
        }),
      onSettled: () => setToDelete(null),
    });
  };

  if (isPending) return <CustomSkeleton />;
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Shield size={20} />
          </div>
          <span>{t("misc.l3L4L5Protection")}</span>
        </CardTitle>
        <CardDescription>
          {t("misc.protectionProfilesForServices")}
        </CardDescription>
        <CardAction>
          <Button onClick={() => setDialog({})}>
            <Plus />
            {t("misc.createMitigationTemplate")}
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={typeItems}
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {typeItems.map((i) => (
                  <SelectItem key={i.value ?? ""} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <InputGroup className="max-w-sm">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("misc.searchByName")}
            />
          </InputGroup>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "animate-spin" : ""} />
            {t("misc.refresh")}
          </Button>
        </div>

        {message && (
          <Alert variant={message.error ? "destructive" : "default"}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {filtered.length === 0 ? (
          <div className="py-10">
            <EmptySheet />
            <p className="text-center text-muted-foreground mt-2">
              {t("misc.noTemplatesFound")}
            </p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("misc.templateName")}</TableHead>
                  <TableHead>{t("misc.type")}</TableHead>
                  <TableHead>{t("navigation.attachedZones")}</TableHead>
                  <TableHead>{t("misc.createdAt")}</TableHead>
                  <TableHead>{t("misc.updatedAt")}</TableHead>
                  <TableHead className="text-right">
                    {t("misc.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((tpl) => (
                  <TableRow key={tpl.templateName}>
                    <TableCell>
                      <button
                        type="button"
                        className="cursor-pointer font-medium hover:underline"
                        onClick={() => setDialog({ template: tpl })}
                      >
                        {tpl.templateName}
                      </button>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {templateTypeLabel(tpl.templateType, t)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Truncated
                        max={MAX_ZONES_SHOWN}
                        items={(tpl.attachedZones ?? []).map((z) => (
                          <Badge key={z} variant="outline">
                            {z}
                          </Badge>
                        ))}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tpl.createdAt ? formatDateTime(tpl.createdAt) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tpl.updatedAt ? formatDateTime(tpl.updatedAt) : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title={t("misc.edit")}
                          onClick={() => setDialog({ template: tpl })}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          title={t("misc.delete")}
                          onClick={() => setToDelete(tpl)}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filtered.length > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-muted-foreground">
                  {start + 1}–{start + pageRows.length} / {filtered.length}
                </span>
                <Pagination className="mx-0 w-auto">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        aria-disabled={currentPage === 1}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : ""
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
          </>
        )}
      </CardContent>

      <TemplateFormDialog
        open={dialog !== null}
        onOpenChange={(open) => !open && setDialog(null)}
        template={dialog?.template}
        onSaved={onSaved}
      />

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("misc.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{toDelete?.templateName}</b> {t("misc.deleteThisTemplate")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("misc.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTemplate.isPending}
            >
              {t("misc.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
