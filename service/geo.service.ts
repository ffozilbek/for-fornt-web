import { api, ApiError } from "@/lib/api";
import {
  geoCountriesResponseSchema,
  TemplateGeo,
  templateGeoSchema,
  TemplateSmartGeo,
  templateSmartGeoSchema,
  zoneMutationResponseSchema,
} from "@/types/dashboard";

const postGeo = async (url: string, body: Record<string, unknown>) => {
  const { data } = await api.post(url, body);
  const res = zoneMutationResponseSchema.parse(data);
  if (res.status === "error") throw new ApiError(res.message);
  return res;
};

// shablon geo sozlamalari DB da emas, backenddagi json faylda saqlanadi
export const geoService = {
  getCountries: async () => {
    const { data } = await api.get("/api/geo/countries");
    return geoCountriesResponseSchema.parse(data).countries;
  },

  getTemplateGeo: async (template: string) => {
    const { data } = await api.get("/api/geo/tpl/config", {
      params: { template },
    });
    return templateGeoSchema.parse(data);
  },

  saveTemplateGeo: (template: string, geo: TemplateGeo) =>
    postGeo("/api/geo/tpl/save", { template, ...geo }),

  getTemplateSmartGeo: async (template: string) => {
    const { data } = await api.get("/api/geo/tpl/smart/config", {
      params: { template },
    });
    return templateSmartGeoSchema.parse(data);
  },

  // o'chirilgan holat ham saqlanadi (enabled: false)
  saveTemplateSmartGeo: (template: string, smart: TemplateSmartGeo) =>
    postGeo("/api/geo/tpl/smart/save", { template, ...smart }),
};
