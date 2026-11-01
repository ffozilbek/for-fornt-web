"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/flow-log/CaptureBar";
import { useSaveUser } from "@/hooks/useUsers";
import type { AppUser, UserSavePayload } from "@/types/auth";

type EditRole = UserSavePayload["role"];
const ROLE_ITEMS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
];

type Props = {
  // null — yopiq; "new" — yangi foydalanuvchi; AppUser — tahrir
  target: AppUser | "new" | null;
  onClose: () => void;
  onSaved: (text: string) => void;
};

// yangi foydalanuvchi qo'shish / tahrirlash (tahrirda bo'sh parol — o'zgarmaydi)
export default function UserDialog({ target, onClose, onSaved }: Props) {
  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && <UserForm key={target === "new" ? "new" : target.username} target={target} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function UserForm({ target, onClose, onSaved }: { target: AppUser | "new"; onClose: () => void; onSaved: (text: string) => void }) {
  const { t } = useTranslation();
  const isNew = target === "new";
  const [username, setUsername] = useState(isNew ? "" : target.username);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<EditRole>(isNew || target.role === "superadmin" ? "user" : target.role);
  const [error, setError] = useState<string | null>(null);
  const save = useSaveUser();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    const pwd = password.trim();
    if (name.length < 2) return setError(t("auth.usernameMustBeAtLeast2Characters"));
    if (isNew && !pwd) return setError(t("auth.usernameAndPasswordAreRequired"));
    if (pwd && pwd.length < 6) return setError(t("auth.passwordMustBeAtLeast6Characters"));
    setError(null);
    save.mutate(
      { original: isNew ? undefined : target.username, username: name, password: pwd, role },
      {
        onSuccess: () => {
          onSaved(t(isNew ? "account.userCreated" : "account.userUpdated", { name }));
          onClose();
        },
        onError: (err) =>
          setError(err.message.startsWith("http.") ? t("misc.noConnectionWithServer") : err.message),
      },
    );
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{t(isNew ? "misc.addNewUser" : "misc.editUser")}</DialogTitle>
      </DialogHeader>
      <Field>
        <FieldLabel htmlFor="user-name">{t("auth.username")}</FieldLabel>
        <Input id="user-name" autoComplete="off" value={username} onChange={(e) => setUsername(e.target.value)} />
      </Field>
      <Field>
        <FieldLabel htmlFor="user-password">
          {isNew ? t("auth.password") : t("auth.newPasswordLeaveEmptyToKeep")}
        </FieldLabel>
        <Input
          id="user-password"
          type="password"
          autoComplete="new-password"
          placeholder={t("auth.passwordMustBeAtLeast6Characters")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="user-role">{t("misc.role")}</FieldLabel>
        <SimpleSelect
          id="user-role"
          items={ROLE_ITEMS}
          value={role}
          onChange={(r) => setRole(r as EditRole)}
          className="w-full"
        />
      </Field>
      {error && <FieldError>{error}</FieldError>}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t("misc.cancel")}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {t("misc.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
