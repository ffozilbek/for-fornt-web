import { api, ApiError } from "@/lib/api";
import {
  ServiceSavePayload,
  zoneMutationResponseSchema,
  ZoneSavePayload,
} from "@/types/dashboard";

// /api/zones -> backend /zones (next.config.ts rewrite)
const postZone = async (body: Record<string, unknown>) => {
  const { data } = await api.post("/api/zones", body);
  const res = zoneMutationResponseSchema.parse(data);
  if (res.status === "error") throw new ApiError(res.message);
  return res;
};

// /api/services javobi zonaniki bilan bir xil: { status, message }
const postService = async (body: Record<string, unknown>) => {
  const { data } = await api.post("/api/services", body);
  const res = zoneMutationResponseSchema.parse(data);
  if (res.status === "error") throw new ApiError(res.message);
  return res;
};

export const zonesService = {
  saveZone: (payload: ZoneSavePayload) => postZone(payload),

  deleteZone: (zoneName: string) => postZone({ action: "delete", zoneName }),

  saveService: (payload: ServiceSavePayload) => postService(payload),

  deleteService: (zoneName: string, serviceName: string) =>
    postService({ action: "delete", zoneName, serviceName }),
};
