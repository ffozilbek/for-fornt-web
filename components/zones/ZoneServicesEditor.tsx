"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldError, FieldLabel } from "@/components/ui/field";
import { formatDateTime } from "@/lib/format";
import {
  newServiceRow,
  PROTO_TO_TEMPLATE_TYPES,
  PROTO_WITH_PORTS,
  PROTOCOLS,
  ServiceRow,
  validateServiceRow,
} from "@/lib/zone-services";
import { MitigationTemplate } from "@/types/dashboard";

type Props = {
  rows: ServiceRow[];
  onChange: (rows: ServiceRow[]) => void;
  templates: MitigationTemplate[];
  loading?: boolean;
};

// tasdiq kutayotgan o'chirish: bitta qator yoki hammasi
type PendingDelete = { kind: "one"; id: number } | { kind: "all" } | null;

export default function ZoneServicesEditor({
  rows,
  onChange,
  templates,
  loading,
}: Props) {
  const { t } = useTranslation();
  const [rowErrors, setRowErrors] = useState<Record<number, string>>({});
  const [pending, setPending] = useState<PendingDelete>(null);

  const visible = rows.filter((r) => !r.deleted);

  const patch = (id: number, p: Partial<ServiceRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...p } : r)));

  const clearError = (id: number) =>
    setRowErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

  const addRow = () => onChange([newServiceRow(), ...rows]);

  const confirmRow = (r: ServiceRow) => {
    const err = validateServiceRow(r, t);
    if (err) {
      setRowErrors((prev) => ({ ...prev, [r.id]: err }));
      return;
    }
    clearError(r.id);
    patch(r.id, { editing: false });
  };

  // saqlanmagan qator darhol olib tashlanadi, saqlangani tasdiqdan keyin
  const requestDelete = (r: ServiceRow) => {
    if (r.originalName) setPending({ kind: "one", id: r.id });
    else {
      clearError(r.id);
      onChange(rows.filter((x) => x.id !== r.id));
    }
  };

  const applyDelete = () => {
    if (!pending) return;
    if (pending.kind === "one")
      onChange(
        rows.map((r) => (r.id === pending.id ? { ...r, deleted: true } : r)),
      );
    else
      onChange(
        rows.filter((r) => r.originalName).map((r) => ({ ...r, deleted: true })),
      );
    setRowErrors({});
    setPending(null);
  };

  const templateItems = (r: ServiceRow) => {
    const allowed = PROTO_TO_TEMPLATE_TYPES[r.protocol] ?? [];
    const list = templates
      .filter((tpl) => allowed.includes(tpl.templateType))
      .map((tpl) => ({
        value: tpl.templateName as string | null,
        label: `${tpl.templateName} (${tpl.templateType})`,
      }));
    // backenddagi shablon o'chirilgan bo'lsa ham joriy qiymat ko'rinib tursin
    if (
      r.protectionProfile &&
      !list.some((i) => i.value === r.protectionProfile)
    )
      list.push({
        value: r.protectionProfile,
        label: `${r.protectionProfile} ${t("errors.notFound")}`,
      });
    return [{ value: null, label: "—" }, ...list];
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>
          {t("misc.services")}
          <span className="text-muted-foreground font-normal">
            {visible.length} {t("misc.items")}
          </span>
        </FieldLabel>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setPending({ kind: "all" })}
            disabled={visible.length === 0}
          >
            <Trash2 className="text-destructive" />
            {t("misc.deleteAll")}
          </Button>
          <Button type="button" size="sm" onClick={addRow}>
            <Plus />
            {t("misc.addService")}
          </Button>
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">{t("misc.protocol3")}</TableHead>
              <TableHead>Port / Protocol Num</TableHead>
              <TableHead className="w-56">
                {t("misc.mitigationTemplate2")}
              </TableHead>
              <TableHead>{t("misc.created")}</TableHead>
              <TableHead className="w-20 text-right">
                {t("misc.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-6 text-center"
                >
                  {loading
                    ? t("misc.loading")
                    : t("misc.noServicesAddOneUsingTheButtonAbove")}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r) => (
                <ServiceRowView
                  key={r.id}
                  row={r}
                  error={rowErrors[r.id]}
                  templateItems={templateItems(r)}
                  onPatch={(p) => {
                    clearError(r.id);
                    patch(r.id, { ...p, dirty: true });
                  }}
                  onConfirm={() => confirmRow(r)}
                  onEdit={() => patch(r.id, { editing: true })}
                  onDelete={() => requestDelete(r)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => !open && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("misc.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === "all"
                ? t("misc.deleteAllServices")
                : t("misc.deleteThisService")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("misc.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={applyDelete}>
              {t("misc.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type RowProps = {
  row: ServiceRow;
  error?: string;
  templateItems: { value: string | null; label: string }[];
  onPatch: (p: Partial<ServiceRow>) => void;
  onConfirm: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function ServiceRowView({
  row: r,
  error,
  templateItems,
  onPatch,
  onConfirm,
  onEdit,
  onDelete,
}: RowProps) {
  const { t } = useTranslation();
  const withPorts = PROTO_WITH_PORTS.has(r.protocol);
  const isProtoNum = r.protocol === "PROTO_NUMBER";

  return (
    <>
      <TableRow className={r.editing ? "bg-muted/40" : undefined}>
        <TableCell>
          <Select
            items={PROTOCOLS}
            value={r.protocol || null}
            disabled={!r.editing}
            // protokol o'zgarsa unga bog'liq maydonlar tozalanadi
            onValueChange={(v) =>
              v !== null &&
              onPatch({
                protocol: v,
                ports: "",
                protocolNumber: 0,
                protectionProfile: "",
              })
            }
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder={t("misc.selectAProtocol")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {PROTOCOLS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell>
          {isProtoNum ? (
            <Input
              className="h-8"
              inputMode="numeric"
              placeholder={t("misc.enterProtocolNumber")}
              value={r.protocolNumber ? String(r.protocolNumber) : ""}
              disabled={!r.editing}
              aria-invalid={!!error}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                onPatch({ protocolNumber: Number.isInteger(n) ? n : 0 });
              }}
            />
          ) : (
            <Input
              className="h-8 font-mono"
              placeholder={withPorts ? t("misc.portOrPortRange") : "—"}
              value={withPorts ? r.ports : ""}
              disabled={!r.editing || !withPorts}
              aria-invalid={!!error}
              onChange={(e) => onPatch({ ports: e.target.value })}
            />
          )}
        </TableCell>
        <TableCell>
          <Select
            items={templateItems}
            value={r.protectionProfile || null}
            disabled={!r.editing || !r.protocol}
            onValueChange={(v) => onPatch({ protectionProfile: v ?? "" })}
          >
            <SelectTrigger size="sm" className="w-full">
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {templateItems.map((i) => (
                  <SelectItem key={i.value ?? ""} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-muted-foreground text-xs">
          {r.createdAt ? formatDateTime(r.createdAt) : t("misc.new")}
        </TableCell>
        <TableCell>
          <div className="flex justify-end gap-1">
            {r.editing ? (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title={t("misc.confirm")}
                onClick={onConfirm}
              >
                <Check className="text-green-600" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                title={t("misc.edit")}
                onClick={onEdit}
              >
                <Pencil />
              </Button>
            )}
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              title={t("misc.delete")}
              onClick={onDelete}
            >
              <Trash2 className="text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {error && (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="pt-0">
            <FieldError>{error}</FieldError>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
