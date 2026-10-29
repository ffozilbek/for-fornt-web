"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Download, FileText, Keyboard, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  useTemplateList,
  useTemplateListAction,
} from "@/hooks/useMitigationTemplates";
import {
  TemplateListKind,
  templateListsService,
} from "@/service/mitigation-templates.service";
import { TemplateListFile } from "@/types/dashboard";

export type Notice = { text: string; error?: boolean };

type Props = {
  kind: TemplateListKind;
  // saqlangan shablon nomi; yaratish rejimida undefined
  template?: string;
  // yaratish rejimida shablonni avtomatik saqlab nomini qaytaradi
  ensureSaved: () => Promise<string | null>;
  onNotice: (n: Notice) => void;
};

const kindText = (kind: TemplateListKind, t: TFunction) => {
  switch (kind) {
    case "whitelist":
    case "blacklist":
      return {
        accept: kind === "whitelist" ? ".txt" : ".txt,.csv,.xlsx",
        manualTitle:
          kind === "whitelist"
            ? t("misc.whitelistManualIPEntry")
            : t("misc.blacklistManualIPEntry"),
        manualLabel: t("misc.iPsOrSubnetsOnePerLine"),
        manualHint: t("misc.enterOnlyIPOrSubnetOnePerLineOrCommaSepa"),
        placeholder: "192.168.1.1\n10.0.0.0/24\n172.16.0.100",
        countLabel: t("misc.currentIPCIDRCount"),
      };
    case "ja4t":
      return {
        accept: ".csv,.txt",
        manualTitle: t("misc.jA4TManualEntry"),
        manualLabel: t("misc.jA4TOnePerLine"),
        manualHint: t("misc.enterOnlyJA4TOnePerLineOrCommaSeparated"),
        placeholder: "65535_2-4-8-1-3_1460_8\n21689_0_0_0",
        countLabel: t("misc.currentJA4TCount"),
        saveFirst: t("misc.saveTheTemplateFirstToUploadAJA4TFileCsv"),
        fileHint: [t("misc.oneJA4TPerLineInTheFileEG"), "65535_2-4-8-1-3_1460_8"],
      };
    case "ja4":
      return {
        accept: ".csv,.txt",
        manualTitle: t("misc.jA4ManualEntry"),
        manualLabel: t("misc.jA4OnePerLine"),
        manualHint: t("misc.enterOnlyJA4OnePerLineOrCommaSeparated"),
        placeholder: "t13d1516h2_8daaf6152771_b0da82dd1658",
        countLabel: t("misc.currentJA4Count"),
        saveFirst: t("misc.saveTheTemplateFirstToUploadAJA4FileCsvO"),
        fileHint: [
          t("misc.oneJA4PerLineInTheFileEG"),
          "t13d1516h2_8daaf6152771_b0da82dd1658",
        ],
      };
    case "sni":
      return {
        accept: ".txt,.csv",
        manualTitle: t("misc.sNIManualEntry"),
        manualLabel: t("misc.sNINamesOnePerLine"),
        manualHint: t("misc.domainNamesSNIOnlyOnePerLineOrCommaSepar"),
        placeholder: "example.com\napi.example.com",
        countLabel: t("misc.currentSNICount"),
        saveFirst: t("misc.saveTheTemplateFirstToUploadAnSNIFileTxt"),
        fileHint: [t("misc.oneSNIPerLineInTheFileEG"), "example.com"],
      };
  }
};

// IP ro'yxatida ip + subnet, boshqalarida o'z son maydoni
const fileCount = (f: TemplateListFile) =>
  (f.ip_count ?? 0) +
  (f.subnet_count ?? 0) +
  (f.ja4t_count ?? 0) +
  (f.ja4_count ?? 0) +
  (f.sni_count ?? 0);

export default function TemplateListPanel({
  kind,
  template,
  ensureSaved,
  onNotice,
}: Props) {
  const { t } = useTranslation();
  const text = kindText(kind, t);
  const list = useTemplateList(kind, template);
  const action = useTemplateListAction(kind);
  const fileInput = useRef<HTMLInputElement>(null);

  // qo'lda kiritish oynasi ochiq bo'lsa — saqlangan shablon nomi
  const [manualFor, setManualFor] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);

  const errorText = (err: Error) =>
    err.message.startsWith("http.")
      ? t("misc.noConnectionWithServer")
      : err.message;

  const openManual = async () => {
    const name = await ensureSaved();
    if (name) setManualFor(name);
  };

  const onFile = async (file: File | undefined) => {
    if (fileInput.current) fileInput.current.value = "";
    if (!file) return;
    const name = await ensureSaved();
    if (!name) return;
    action.mutate(
      { template: name, action: "upload", file },
      {
        onSuccess: () => onNotice({ text: t("misc.uploaded") }),
        onError: (err) => onNotice({ text: errorText(err), error: true }),
      },
    );
  };

  const confirmDelete = () => {
    if (!template || !toDelete) return;
    action.mutate(
      { template, action: "delete", filename: toDelete },
      {
        onError: (err) => onNotice({ text: errorText(err), error: true }),
        onSettled: () => setToDelete(null),
      },
    );
  };

  const files = list.data?.files ?? [];

  return (
    <div className="flex flex-col gap-3">
      {!template && text.saveFirst && (
        <FieldDescription>{text.saveFirst}</FieldDescription>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          onClick={openManual}
          disabled={action.isPending}
        >
          <Keyboard />
          {t("misc.manualEntry")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => fileInput.current?.click()}
          disabled={action.isPending}
        >
          <Upload />
          {t("misc.uploadFile")}
        </Button>
        <input
          ref={fileInput}
          type="file"
          hidden
          accept={text.accept}
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>

      {text.fileHint && (
        <FieldDescription>
          {text.fileHint[0]}{" "}
          <span className="font-mono">{text.fileHint[1]}</span>
          {t("misc.onlyCsvOrTxt")}
        </FieldDescription>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-muted-foreground text-xs">
          {t("misc.uploadedFiles")}
        </span>
        <ul className="bg-background max-h-36 divide-y overflow-y-auto rounded-md border">
          {files.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-xs">
              {list.isFetching ? t("misc.loading") : t("misc.noFiles")}
            </li>
          ) : (
            files.map((f) => (
              <li
                key={f.filename}
                className="flex items-center gap-2 px-3 py-1.5 text-xs"
              >
                <FileText className="text-muted-foreground size-3.5 shrink-0" />
                <span className="flex-1 truncate font-medium">
                  {f.filename}
                </span>
                <span className="text-muted-foreground">
                  {fileCount(f)} {t("misc.items")}
                </span>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  title={t("misc.download")}
                  onClick={() => {
                    window.location.href = templateListsService.downloadUrl(
                      kind,
                      template!,
                      f.filename,
                    );
                  }}
                >
                  <Download />
                </Button>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  title={t("misc.delete")}
                  onClick={() => setToDelete(f.filename)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))
          )}
        </ul>
        <span className="text-muted-foreground text-xs">
          {text.countLabel} {list.data?.count ?? 0}
        </span>
      </div>

      <ManualEntryDialog
        template={manualFor}
        title={text.manualTitle}
        label={text.manualLabel}
        hint={text.manualHint}
        placeholder={text.placeholder}
        onClose={() => setManualFor(null)}
        onSubmit={(name, value, done) =>
          action.mutate(
            { template: name, action: "manual", text: value },
            {
              onSuccess: () => {
                onNotice({ text: t("misc.saved") });
                done(null);
              },
              onError: (err) => done(errorText(err)),
            },
          )
        }
        pending={action.isPending}
      />

      <AlertDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("misc.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{toDelete}</b> {t("misc.deleteThisFile")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("misc.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDelete}
              disabled={action.isPending}
            >
              {t("misc.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type ManualProps = {
  template: string | null;
  title: string;
  label: string;
  hint: string;
  placeholder: string;
  pending: boolean;
  onClose: () => void;
  // done(null) — muvaffaqiyat (oyna yopiladi), done(xato) — xato ko'rsatiladi
  onSubmit: (
    template: string,
    value: string,
    done: (error: string | null) => void,
  ) => void;
};

function ManualEntryDialog({ template, onClose, ...props }: ManualProps) {
  return (
    <Dialog open={template !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {template !== null && (
          <ManualEntryForm template={template} onClose={onClose} {...props} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManualEntryForm({
  template,
  title,
  label,
  hint,
  placeholder,
  pending,
  onClose,
  onSubmit,
}: ManualProps & { template: string }) {
  const { t } = useTranslation();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const v = value.trim();
    if (!v) {
      setError(t("misc.nothingEntered"));
      return;
    }
    onSubmit(template, v, (err) => (err ? setError(err) : onClose()));
  };

  return (
    <div className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <Field>
        <FieldLabel htmlFor="tpl-manual">{label}</FieldLabel>
        <Textarea
          id="tpl-manual"
          autoFocus
          rows={8}
          className="font-mono"
          value={value}
          placeholder={placeholder}
          aria-invalid={!!error}
          onChange={(e) => {
            setError(null);
            setValue(e.target.value);
          }}
        />
        <FieldDescription>{hint}</FieldDescription>
        {error && <FieldError>{error}</FieldError>}
      </Field>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t("misc.cancel")}
        </Button>
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? t("misc.loading") : t("misc.save")}
        </Button>
      </DialogFooter>
    </div>
  );
}
