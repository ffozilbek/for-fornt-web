"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { KeySquare, Save } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useChangePassword } from "@/hooks/useAuth";

const EMPTY = { old_password: "", new_password: "", new_password2: "" };

// parolni faqat superadmin o'zgartira oladi (backend boshqalarga 403 qaytaradi)
export default function ChangePasswordCard({
  canChange,
}: {
  canChange: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const change = useChangePassword();

  const set =
    (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      setDone(false);
    };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = {
      old_password: form.old_password.trim(),
      new_password: form.new_password.trim(),
      new_password2: form.new_password2.trim(),
    };
    if (!v.old_password || !v.new_password || !v.new_password2)
      return setError(t("account.allFieldsRequired"));
    if (v.new_password.length < 6)
      return setError(t("auth.passwordMustBeAtLeast6Characters"));
    if (v.new_password !== v.new_password2)
      return setError(t("account.passwordsDoNotMatch"));
    setError(null);
    change.mutate(v, {
      onSuccess: () => {
        setForm(EMPTY);
        setDone(true);
      },
      onError: (err) =>
        setError(
          err.message.startsWith("http.")
            ? t("misc.noConnectionWithServer")
            : err.message,
        ),
    });
  };

  const field = (
    k: keyof typeof EMPTY,
    label: string,
    autoComplete: string,
  ) => (
    <Field>
      <FieldLabel htmlFor={`pwd-${k}`}>{label}</FieldLabel>
      <Input
        id={`pwd-${k}`}
        type="password"
        autoComplete={autoComplete}
        value={form[k]}
        onChange={set(k)}
      />
    </Field>
  );

  return (
    <Card id="password" className="scroll-mt-20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent flex h-8 w-8 items-center justify-center rounded-md">
            <KeySquare size={18} />
          </div>
          {t("auth.changePassword")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {canChange ? (
          <form onSubmit={submit} className="grid max-w-md gap-4">
            {field(
              "old_password",
              t("account.oldPassword"),
              "current-password",
            )}
            {field("new_password", t("account.newPassword"), "new-password")}
            {field(
              "new_password2",
              t("account.confirmPassword"),
              "new-password",
            )}
            {error && <FieldError>{error}</FieldError>}
            {done && (
              <Alert>
                <AlertDescription>
                  {t("account.passwordChanged")}
                </AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-fit" disabled={change.isPending}>
              <Save />
              {t("misc.save")}
            </Button>
          </form>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t("account.onlySuperAdminCanChangePassword")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
