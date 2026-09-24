import { api } from "@/lib/api";
import { SystemResources } from "@/lib/types";

export const resourcesService = {
  getSystemResources: async (): Promise<SystemResources> => {
    const { data } = await api.get<SystemResources>("/api/system-resources");
    return data;
  },
};
