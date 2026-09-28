"use client";
import { useEffect } from "react";
import i18next from "@/lib/i18n";

export default function I18nInit() {
  useEffect(() => {
    const saved = localStorage.getItem("app_lang");
    if (saved) i18next.changeLanguage(saved);
    const onChange = (l: string) => {
      localStorage.setItem("app_lang", l);
      document.documentElement.lang = l;
    };
    i18next.on("languageChanged", onChange);
    return () => i18next.off("languageChanged", onChange);
  }, []);
  return null;
}
