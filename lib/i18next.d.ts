import "i18next";
import uz from "@/messages/uz.json";

// i18next uchun rasmiy tip-kengaytirish: shu fayl loyihada bo'lishi
// kifoya (import qilish shart emas), VS Code avtomatik o'qiydi.
// Shundan keyin t("auth.signIn") deb yozayotganda autocomplete ishlaydi,
// va t("auth.notARealKey") kabi xato kalit yozsangiz TypeScript xato beradi.
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: typeof uz;
    };
  }
}
