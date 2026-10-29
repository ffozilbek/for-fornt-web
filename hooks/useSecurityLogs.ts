import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { securityLogsService } from "@/service/security-logs.service";
import { LogQuery } from "@/types/dashboard";

export const useSecurityLogs = (query: LogQuery) =>
  useQuery({
    queryKey: queryKeys.securityLogs(query),
    queryFn: () => securityLogsService.getLogs(query),
    placeholderData: keepPreviousData,
  });
