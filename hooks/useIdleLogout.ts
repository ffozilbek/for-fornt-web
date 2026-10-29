"use client";

import { useEffect } from "react";
import { useLogout } from "@/hooks/useAuth";

// Harakatsizlik chegarasi. O'zgartirish kerak bo'lsa — faqat shu qator.
const IDLE_MS = 5 * 60 * 1000; // 5 daqiqa
const CHECK_MS = 10 * 1000; // har 10 sekundda tekshiramiz
const LS_KEY = "antiddos.lastActivity";

// Faqat haqiqiy foydalanuvchi hodisalari. Fon so'rovlari (polling) hisobga
// olinmaydi, aks holda taymer hech qachon ishlamasdi. `mousemove` ataylab yo'q:
// sichqonchaning tasodifiy siljishi harakat hisoblanmaydi.
const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "wheel", "scroll"];

// Eski dashboarddagi static/js/idle_timeout.js ning ko'chirmasi:
// IDLE_MS davomida harakat bo'lmasa sessiya yopiladi va /login ga o'tiladi.
// Vaqt muhri bilan tekshiriladi (noutbuk uxlab qolsa ham uyg'onganda to'g'ri
// ishlaydi) va oxirgi harakat vaqti localStorage orqali tablar o'rtasida umumiy.
export function useIdleLogout() {
  const { mutate: logout } = useLogout();

  useEffect(() => {
    let lastActivity = Date.now();
    let loggingOut = false;

    const markActivity = () => {
      lastActivity = Date.now();
      try {
        localStorage.setItem(LS_KEY, String(lastActivity));
      } catch {
        // localStorage yopiq — taymer faqat shu tab doirasida ishlaydi
      }
    };

    const lastActivityAcrossTabs = () => {
      try {
        const shared = Number(localStorage.getItem(LS_KEY) ?? 0);
        if (shared > lastActivity) return shared;
      } catch {}
      return lastActivity;
    };

    // capture — ichki ishlovchilar stopPropagation() qilsa ham ko'ramiz
    const opts = { capture: true, passive: true };
    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, markActivity, opts));
    markActivity(); // dashboardga kirish = harakat

    const timer = setInterval(() => {
      if (loggingOut || Date.now() - lastActivityAcrossTabs() < IDLE_MS) return;
      loggingOut = true;
      logout();
    }, CHECK_MS);

    return () => {
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((e) =>
        document.removeEventListener(e, markActivity, opts),
      );
    };
  }, [logout]);
}
