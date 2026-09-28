"use client";

import { useTranslation } from "react-i18next";

export default function HomePage() {
  const { t, i18n } = useTranslation();
  return (
    <div>
      {t("Anti-DDoS Protection")}
      <button onClick={() => i18n.changeLanguage("ru")}>RU</button>
    </div>
  );
}
