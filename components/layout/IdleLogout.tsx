"use client";

import { useIdleLogout } from "@/hooks/useIdleLogout";

// layout server komponenti bo'lgani uchun hook shu yerda ulanadi
export default function IdleLogout() {
  useIdleLogout();
  return null;
}
