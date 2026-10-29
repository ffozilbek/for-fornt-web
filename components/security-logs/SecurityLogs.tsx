"use client";

import { useTranslation } from "react-i18next";
import { ShieldCheck, ShieldEllipsis } from "lucide-react";
import LogsCard from "@/components/shared/LogsCard";
import { useSecurityLogs } from "@/hooks/useSecurityLogs";
import { securityLogsService } from "@/service/security-logs.service";

export default function SecurityLogs() {
  const { t } = useTranslation();

  return (
    <LogsCard
      title={t("navigation.securityLogs")}
      icon={ShieldEllipsis}
      useLogs={useSecurityLogs}
      exportUrl={securityLogsService.exportUrl}
      loadingText={t("navigation.loadingAttackerLogs")}
      empty={{
        icon: ShieldCheck,
        iconClassName: "text-green-500",
        title: t("navigation.noAttackerLogsFound"),
        hint: t("misc.systemIsSecure"),
      }}
    />
  );
}
