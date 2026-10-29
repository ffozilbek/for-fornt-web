import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { auditLogsService } from "@/service/audit-logs.service";
import { LogQuery } from "@/types/dashboard";

export const useAuditLogs = (query: LogQuery) =>
  useQuery({
    queryKey: queryKeys.auditLogs(query),
    queryFn: () => auditLogsService.getLogs(query),
    placeholderData: keepPreviousData,
  });
