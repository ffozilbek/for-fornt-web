import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import uz from "@/i18n/uz.json";
import en from "@/i18n/en.json";
import ru from "@/i18n/ru.json";

i18next.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: "uz",
  fallbackLng: "uz",
  keySeparator: false, // jumla-kalitlar uchun shart
  nsSeparator: false, // jumla-kalitlar uchun shart
  interpolation: { prefix: "{", suffix: "}", escapeValue: false },
});

export default i18next;
