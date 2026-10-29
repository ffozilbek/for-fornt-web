"use client";

import { useTranslation } from "react-i18next";
import { ClipboardList, FileClock } from "lucide-react";
import LogsCard from "@/components/shared/LogsCard";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { auditLogsService } from "@/service/audit-logs.service";

export default function AuditLogs() {
  const { t } = useTranslation();

  return (
    <LogsCard
      title={t("navigation.auditLogs")}
      description={t("navigation.auditLogsHistoryForZonesAndServices")}
      icon={FileClock}
      useLogs={useAuditLogs}
      exportUrl={auditLogsService.exportUrl}
      loadingText={t("navigation.loadingLogs")}
      empty={{
        icon: ClipboardList,
        iconClassName: "text-muted-foreground",
        title: t("navigation.noAuditLogsFound"),
        hint: t("misc.tryAdjustingFilters"),
      }}
    />
  );
}
