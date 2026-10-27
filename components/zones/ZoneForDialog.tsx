"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useMitigationTemplates,
  useSaveZoneWithServices,
  useZoneServices,
} from "@/hooks/useZones";
import {
  rowFromService,
  ServiceRow,
  validateServiceRow,
  validateServiceRows,
} from "@/lib/zone-services";
import { Zone } from "@/types/dashboard";
import ZoneServicesEditor from "./ZoneServicesEditor";

export type ZoneDialogMode = "create" | "edit" | "duplicate";

const MAX_IPS = 5;

// IPv4 yoki IPv4/CIDR (zones.js dagi bilan bir xil)
const IP_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?:\/(\d{1,2}))?$/;
export const isValidIp = (v: string) => {
  const m = IP_RE.exec(v);
  if (!m) return false;
  if (m.slice(1, 5).some((o) => Number(o) > 255)) return false;
  return m[5] === undefined || Number(m[5]) <= 32;
};

// backend /32 ni qo'shib saqlaydi, ko'rsatishda olib tashlaymiz
export const displayIp = (ip: string) => ip.replace(/\/32$/, "");

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ZoneDialogMode;
  zone?: Zone;
  onSaved?: (mode: ZoneDialogMode) => void;
};

export default function ZoneForDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        {/* har ochilganda forma qaytadan boshlanadi */}
        {props.open && <ZoneForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

// edit/duplicate da servislar yuklangach forma ochiladi, toki qatorlar
// boshlang'ich holati to'liq bo'lsin
function ZoneForm(props: Props) {
  const { t } = useTranslation();
  const sourceZone = props.mode === "create" ? "" : (props.zone?.zoneName ?? "");
  const services = useZoneServices(sourceZone, true);

  if (sourceZone && services.isPending)
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("misc.loading")}
      </p>
    );

  // duplikatda servislar yangi zonaga yangi qator sifatida qo'shiladi
  const initialRows = (services.data ?? [])
    .map((s) => rowFromService(s, props.mode === "duplicate"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return <ZoneFormInner {...props} initialRows={initialRows} />;
}

function ZoneFormInner({
  onOpenChange,
  mode,
  zone,
  onSaved,
  initialRows,
}: Props & { initialRows: ServiceRow[] }) {
  const { t } = useTranslation();
  const save = useSaveZoneWithServices();
  const templates = useMitigationTemplates();
  const [ipInput, setIpInput] = useState("");
  const [rows, setRows] = useState(initialRows);

  const schema = useMemo(
    () =>
      z.object({
        zoneName: z
          .string()
          .trim()
          .min(1, t("navigation.zoneNameIsRequired"))
          .max(63, t("navigation.zoneNameMustNotExceed63Characters")),
        ips: z
          .array(z.string())
          .min(1, t("misc.atLeast1IPSubnetIsRequired"))
          .max(MAX_IPS, t("navigation.aZoneCannotHaveMoreThan5IPSubnets")),
      }),
    [t],
  );
  type FormFields = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: {
      zoneName: mode === "edit" ? (zone?.zoneName ?? "") : "",
      ips: mode === "edit" ? (zone?.ips.map(displayIp) ?? []) : [],
    },
  });

  const ips = useWatch({ control, name: "ips" });
  const candidate = ipInput.trim();
  const isDuplicate = ips.includes(candidate);
  const ipError =
    candidate === ""
      ? null
      : !isValidIp(candidate)
        ? `${t("errors.invalidIPSubnet")} ${candidate}`
        : isDuplicate
          ? t("misc.thisIPSubnetIsAlreadyInTheList")
          : null;
  const canAdd = candidate !== "" && !ipError && ips.length < MAX_IPS;

  const addIp = () => {
    if (!canAdd) return;
    setValue("ips", [...ips, candidate], { shouldValidate: true });
    setIpInput("");
  };

  const removeIp = (ip: string) =>
    setValue(
      "ips",
      ips.filter((i) => i !== ip),
      { shouldValidate: true },
    );

  const onIpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    addIp();
  };

  const onSubmit: SubmitHandler<FormFields> = (data) => {
    // tahrirlanayotgan qatorlar avtomatik tasdiqlanadi
    for (const r of rows) {
      if (r.deleted || !r.editing) continue;
      const err = validateServiceRow(r, t);
      if (err) {
        setError("root", { message: `${t("errors.rowError")} ${err}` });
        return;
      }
    }
    const rowErrors = validateServiceRows(rows, t);
    if (rowErrors.length) {
      const extra = rowErrors.length > 3 ? ` (+${rowErrors.length - 3})` : "";
      setError("root", { message: rowErrors.slice(0, 3).join(" | ") + extra });
      return;
    }

    save.mutate(
      {
        zone: {
          action: mode === "edit" ? "edit" : "add",
          zoneName: data.zoneName,
          ips: data.ips,
        },
        rows,
        t,
      },
      {
        onSuccess: () => {
          onSaved?.(mode);
          onOpenChange(false);
        },
        onError: (err) =>
          setError("root", {
            message: err.message.startsWith("http.")
              ? t("misc.noConnectionWithServer")
              : err.message,
          }),
      },
    );
  };

  const title = {
    create: t("navigation.addNewZone"),
    edit: t("navigation.editZone"),
    duplicate: t("navigation.duplicateZone"),
  }[mode];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <FieldGroup>
        {errors.root && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-center text-xs text-destructive">
            {errors.root.message}
          </div>
        )}

        <Field>
          <FieldLabel htmlFor="zone-name">
            {t("navigation.zoneName")}
          </FieldLabel>
          <Input
            id="zone-name"
            {...register("zoneName")}
            placeholder="www.example.com"
            disabled={mode === "edit"}
            aria-invalid={!!errors.zoneName}
          />
          {mode === "edit" && (
            <FieldDescription>
              {t("navigation.zoneNameCannotBeChanged")}
            </FieldDescription>
          )}
          <FieldError errors={[errors.zoneName]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="zone-ip" className="justify-between">
            <span>{t("misc.iPSubnetListMax5")}</span>
            <span className="text-muted-foreground font-normal">
              {ips.length} {t("misc.items")}
            </span>
          </FieldLabel>
          <div className="flex gap-2">
            <Input
              id="zone-ip"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              onKeyDown={onIpKeyDown}
              placeholder="192.168.1.0/24"
              disabled={ips.length >= MAX_IPS}
              aria-invalid={!!ipError}
            />
            <Button
              type="button"
              size="icon-lg"
              variant="outline"
              onClick={addIp}
              disabled={!canAdd}
            >
              <Plus />
            </Button>
          </div>
          {ipError && <FieldError>{ipError}</FieldError>}

          {ips.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("misc.noIPSubnetAdded")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {ips.map((ip) => (
                <li
                  key={ip}
                  className="flex items-center justify-between px-3 py-1.5 text-sm"
                >
                  <span className="font-mono">{ip}</span>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    onClick={() => removeIp(ip)}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <FieldError errors={[errors.ips]} />
        </Field>

        <ZoneServicesEditor
          rows={rows}
          onChange={setRows}
          templates={templates.data ?? []}
        />
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {t("misc.cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? t("misc.loading") : t("misc.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
