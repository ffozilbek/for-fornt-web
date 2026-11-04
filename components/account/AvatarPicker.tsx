"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  MAX_AVATAR_BYTES,
  toAvatarDataUrl,
  useAvatar,
} from "@/hooks/useAvatar";

// akkaunt rasmi: tanlash / almashtirish / o'chirish (faqat shu brauzerda saqlanadi)
export default function AvatarPicker({ username }: { username: string }) {
  const { t } = useTranslation();
  const [avatar, setAvatar] = useAvatar(username);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // bir xil faylni qayta tanlash mumkin bo'lsin
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > MAX_AVATAR_BYTES)
      return setError(t("account.photoInvalid"));
    try {
      setAvatar(await toAvatarDataUrl(file));
      setError(null);
    } catch {
      setError(t("account.photoInvalid"));
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        className="group relative rounded-full"
        title={t(avatar ? "account.changePhoto" : "account.uploadPhoto")}
        onClick={() => input.current?.click()}
      >
        <Avatar className="size-20">
          {avatar && (
            <AvatarImage src={avatar} alt={username} className="object-cover" />
          )}
          <AvatarFallback className="text-2xl">
            {username.charAt(0).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Camera size={20} />
        </span>
      </button>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => input.current?.click()}
          >
            <Camera />
            {t(avatar ? "account.changePhoto" : "account.uploadPhoto")}
          </Button>
          {avatar && (
            <Button variant="outline" size="sm" onClick={() => setAvatar("")}>
              <Trash2 className="text-destructive" />
              {t("account.removePhoto")}
            </Button>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          {t("account.photoHint")}
        </p>
        {error && <FieldError>{error}</FieldError>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={onFile}
      />
    </div>
  );
}
