"use client";

import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useMitigationTemplates,
  useSaveTemplate,
  useTemplateGeo,
  useTemplateSmartGeo,
} from "@/hooks/useMitigationTemplates";
import {
  hasListEnabled,
  MAX_TEMPLATE_NAME,
  newTemplateGeo,
  newTemplateSmartGeo,
  newTemplateValues,
  TEMPLATE_TYPES,
  TemplateValues,
  templateTypeLabel,
  validateSmartGeo,
  validateTemplate,
  valuesFromTemplate,
} from "@/lib/mitigation-templates";
import { geoService } from "@/service/geo.service";
import {
  MitigationTemplate,
  TemplateGeo,
  TemplateSmartGeo,
} from "@/types/dashboard";
import TemplateSections from "./TemplateSections";
import type { Notice } from "./TemplateListPanel";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // berilsa — tahrirlash, aks holda yaratish
  template?: MitigationTemplate;
  onSaved?: (edited: boolean) => void;
};

export default function TemplateFormDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        {/* har ochilganda forma qaytadan boshlanadi */}
        {props.open && <TemplateForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

// BASIC shablon tahrirlanayotgan bo'lsa geo sozlamalari yuklangach forma
// ochiladi, toki boshlang'ich holat to'liq bo'lsin
function TemplateForm(props: Props) {
  const { t } = useTranslation();
  const name = props.template?.templateName ?? "";
  const withGeo = props.template?.templateType === "BASIC";
  const geo = useTemplateGeo(name, withGeo);
  const smart = useTemplateSmartGeo(name, withGeo);

  if (withGeo && (geo.isPending || smart.isPending))
    return (
      <p className="text-muted-foreground py-10 text-center text-sm">
        {t("misc.loading")}
      </p>
    );

  // yuklab bo'lmasa bo'sh tanlov bilan boshlanadi (eski UI dagi kabi)
  return (
    <TemplateFormInner
      {...props}
      initialGeo={geo.data ?? newTemplateGeo()}
      initialSmartGeo={smart.data ?? newTemplateSmartGeo()}
    />
  );
}

function TemplateFormInner({
  onOpenChange,
  template,
  onSaved,
  initialGeo,
  initialSmartGeo,
}: Props & { initialGeo: TemplateGeo; initialSmartGeo: TemplateSmartGeo }) {
  const { t } = useTranslation();
  const save = useSaveTemplate();
  const templates = useMitigationTemplates();

  // backenddagi nomi; yaratishda shablon saqlangach o'rnatiladi va forma
  // tahrirlash rejimiga o'tadi
  const [savedName, setSavedName] = useState(template?.templateName);
  const isEdit = savedName !== undefined;

  const [name, setName] = useState(template?.templateName ?? "");
  // eski 'SSL-L4' yozuvlari backendda 'TLS' ga aylantirilib keladi
  const [type, setType] = useState(template?.templateType ?? "");
  const [values, setValues] = useState<TemplateValues>(() =>
    template ? valuesFromTemplate(template) : newTemplateValues(),
  );
  const [geo, setGeo] = useState(initialGeo);
  const [smartGeo, setSmartGeo] = useState(initialSmartGeo);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [saving, setSaving] = useState(false);

  const showError = (text: string) => setNotice({ text, error: true });
  const errorText = (err: Error) =>
    err.message.startsWith("http.")
      ? t("misc.noConnectionWithServer")
      : err.message;

  const patch = (p: Partial<TemplateValues>) => {
    setNotice(null);
    setValues((prev) => ({ ...prev, ...p }));
  };

  // tur o'zgarsa bo'limlar default qiymatlardan boshlanadi
  const changeType = (next: string) => {
    setNotice(null);
    setType(next);
    setValues(newTemplateValues());
    setGeo(newTemplateGeo());
    setSmartGeo(newTemplateSmartGeo());
  };

  // shablonni (va BASIC bo'lsa geo sozlamalarini) saqlaydi, nomini qaytaradi.
  // Shablon saqlangach geo xato bersa ham forma tahrirlash rejimiga o'tadi —
  // qayta saqlash POST emas, PUT bo'lishi kerak.
  const persist = async (): Promise<string | null> => {
    const err =
      validateTemplate(name, type, values, t) ??
      (type === "BASIC" ? validateSmartGeo(smartGeo, t) : null);
    if (err) {
      showError(err);
      return null;
    }
    const finalName = name.trim();
    setSaving(true);
    try {
      await save.mutateAsync({
        originalName: savedName,
        payload: { ...values, templateName: finalName, templateType: type },
      });
      setSavedName(finalName);
      if (type === "BASIC") {
        if (values.geoFilterEnable)
          await geoService.saveTemplateGeo(finalName, { ...geo, enabled: true });
        await geoService.saveTemplateSmartGeo(finalName, smartGeo);
      }
      return finalName;
    } catch (e) {
      showError(errorText(e as Error));
      return null;
    } finally {
      setSaving(false);
    }
  };

  // fayl-ro'yxat tugmalari uchun: yaratish rejimida avval shablon saqlanadi
  const ensureSaved = async () => {
    if (savedName) return savedName;
    const saved = await persist();
    if (saved) setNotice({ text: t("misc.templateSavedAutomatically") });
    return saved;
  };

  const typeItems = TEMPLATE_TYPES.map((tt) => ({
    value: tt as string,
    label: templateTypeLabel(tt, t),
  }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const wasEdit = isEdit;
    const saved = await persist();
    if (!saved) return;
    // yangi shablonda ro'yxat yoqilgan bo'lsa forma ochiq qoladi —
    // endi fayl/yozuvlarni kiritish mumkin
    if (!wasEdit && hasListEnabled(type, values)) {
      onSaved?.(false);
      setNotice({ text: t("misc.templateSavedYouCanNowEnterIPsCountries") });
      return;
    }
    onSaved?.(wasEdit);
    onOpenChange(false);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>
          {isEdit
            ? t("misc.editMitigationTemplate")
            : t("misc.createMitigationTemplate")}
        </DialogTitle>
      </DialogHeader>

      <FieldGroup className="gap-4">
        {notice && (
          <div
            className={
              notice.error
                ? "rounded-md border border-destructive/50 bg-destructive/10 p-2.5 text-center text-xs text-destructive"
                : "rounded-md border border-green-600/40 bg-green-600/10 p-2.5 text-center text-xs text-green-700 dark:text-green-400"
            }
          >
            {notice.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="tpl-name">{t("misc.templateName")}</FieldLabel>
            <Input
              id="tpl-name"
              value={name}
              maxLength={MAX_TEMPLATE_NAME}
              placeholder={t("misc.eGTcpStrictV1")}
              onChange={(e) => {
                setNotice(null);
                setName(e.target.value);
              }}
            />
          </Field>
          <Field>
            <FieldLabel>{t("misc.templateType")}</FieldLabel>
            {/* tur tahrirlashda o'zgarmaydi (backend ham ruxsat bermaydi) */}
            <Select
              items={typeItems}
              value={type || null}
              disabled={isEdit}
              onValueChange={(v) => v && changeType(v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("misc.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {typeItems.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex flex-col gap-2">
          <TemplateSections
            type={type}
            values={values}
            onChange={patch}
            templates={templates.data ?? []}
            savedName={savedName}
            ensureSaved={ensureSaved}
            onNotice={setNotice}
            geo={geo}
            onGeoChange={(p) => setGeo((prev) => ({ ...prev, ...p }))}
            smartGeo={smartGeo}
            onSmartGeoChange={(p) => {
              setNotice(null);
              setSmartGeo((prev) => ({ ...prev, ...p }));
            }}
          />
        </div>
      </FieldGroup>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          {t("misc.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("misc.loading") : t("misc.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
