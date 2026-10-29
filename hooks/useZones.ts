import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  autoServiceName,
  PROTO_WITH_PORTS,
  ServiceRow,
} from "@/lib/zone-services";
import { dashboardService } from "@/service/dashboard.service";
import { zonesService } from "@/service/zones.service";
import { Service, ZoneSavePayload } from "@/types/dashboard";

// zona o'zgarganda zonalar ro'yxati va servislar keshini yangilaymiz
const useInvalidateZones = () => {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.zones }),
      qc.invalidateQueries({ queryKey: ["dashboard", "services"] }),
    ]);
};

export const useSaveZone = () => {
  const invalidate = useInvalidateZones();
  return useMutation({
    mutationFn: (payload: ZoneSavePayload) => zonesService.saveZone(payload),
    onSuccess: invalidate,
  });
};

export const useDeleteZone = () => {
  const invalidate = useInvalidateZones();
  return useMutation({
    mutationFn: (zoneName: string) => zonesService.deleteZone(zoneName),
    onSuccess: invalidate,
  });
};

type SaveZoneWithServicesInput = {
  zone: ZoneSavePayload;
  rows: ServiceRow[];
  t: TFunction;
};

// avval zona, keyin servislar diff i (delete -> add/edit) ketma-ket yuboriladi.
// Servis xatolari yig'ilib, oxirida bitta Error sifatida tashlanadi.
const saveZoneWithServices = async ({
  zone,
  rows,
  t,
}: SaveZoneWithServicesInput) => {
  await zonesService.saveZone(zone);

  const errors: string[] = [];
  const run = async (fn: () => Promise<unknown>, prefix: string) => {
    try {
      await fn();
    } catch (e) {
      const msg = (e as Error).message;
      errors.push(
        `${prefix} ${msg.startsWith("http.") ? t("misc.noConnectionWithServer") : msg}`,
      );
    }
  };

  for (const r of rows) {
    if (r.deleted) {
      if (r.originalName)
        await run(
          () => zonesService.deleteService(zone.zoneName, r.originalName),
          `'${r.originalName}' ${t("misc.couldNotBeDeleted")}`,
        );
      continue;
    }

    const serviceName = autoServiceName(r);
    const payload = {
      zoneName: zone.zoneName,
      serviceName,
      protocol: r.protocol,
      ports: PROTO_WITH_PORTS.has(r.protocol) ? r.ports.trim() : "",
      protocolNumber: r.protocol === "PROTO_NUMBER" ? r.protocolNumber : 0,
      protectionProfile: r.protectionProfile,
    };
    if (!r.originalName)
      await run(
        () => zonesService.saveService({ action: "add", ...payload }),
        `'${serviceName}' ${t("misc.couldNotBeAdded")}`,
      );
    else if (r.dirty || r.originalName !== serviceName)
      await run(
        () =>
          zonesService.saveService({
            action: "edit",
            oldServiceName: r.originalName,
            ...payload,
          }),
        `'${r.originalName}' ${t("misc.couldNotBeEdited")}`,
      );
  }

  if (errors.length) {
    const extra = errors.length > 3 ? ` (+${errors.length - 3})` : "";
    throw new ApiError(errors.slice(0, 3).join(" | ") + extra);
  }
};

export const useSaveZoneWithServices = () => {
  const invalidate = useInvalidateZones();
  return useMutation({
    mutationFn: saveZoneWithServices,
    // qisman xato bo'lsa ham zona saqlangan bo'lishi mumkin — keshni yangilaymiz
    onSettled: invalidate,
  });
};

export const useZoneServices = (zone: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.dashboard.services(zone),
    queryFn: () => dashboardService.getServices(zone),
    enabled: enabled && zone !== "",
  });

// har bir zona uchun servislar (backendda umumiy endpoint yo'q)
export const useZonesServices = (zoneNames: string[]) =>
  useQueries({
    queries: zoneNames.map((zone) => ({
      queryKey: queryKeys.dashboard.services(zone),
      queryFn: () => dashboardService.getServices(zone),
    })),
    combine: (results) => {
      const map: Record<string, Service[]> = {};
      results.forEach((r, i) => {
        if (r.data) map[zoneNames[i]] = r.data;
      });
      return map;
    },
  });
