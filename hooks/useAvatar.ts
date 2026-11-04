"use client";
import { usePersistedState } from "@/hooks/usePersistedState";

// akkaunt rasmi faqat shu brauzerda (localStorage) saqlanadi — backend'da
// rasm uchun joy yo'q. Kalit username bo'yicha: har foydalanuvchining o'z rasmi
export const useAvatar = (username: string | undefined) =>
  usePersistedState<string>(`account.avatar.${username ?? ""}`, "");

const SIZE = 256;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

// rasmni markazdan kvadrat qilib qirqib, 256px ga kichraytiradi (localStorage
// hajmi cheklangan — ~5 MB) va data URL qaytaradi
export async function toAvatarDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}
