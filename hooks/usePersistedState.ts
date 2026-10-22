"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";

// bir tabdagi barcha usePersistedState'larni yangilash uchun
const listeners = new Set<() => void>();

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  window.addEventListener("storage", cb); // boshqa tablardagi o'zgarishlar
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
};

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

// useState kabi, lekin qiymat localStorage'da saqlanadi (refreshdan keyin ham qoladi).
// allowed berilsa, saqlangan qiymat ro'yxatda bo'lmasa initial qaytadi.
export function usePersistedState<T>(
  key: string,
  initial: T,
  allowed?: readonly T[],
) {
  // serverda null -> hydration mismatch bo'lmaydi
  const raw = useSyncExternalStore(subscribe, () => read(key), () => null);

  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      const parsed = JSON.parse(raw) as T;
      return allowed && !allowed.includes(parsed) ? initial : parsed;
    } catch {
      return initial;
    }
  }, [raw, initial, allowed]);

  const setValue = useCallback(
    (v: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(v));
      } catch {}
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [value, setValue] as const;
}
