import { api, ApiError } from "@/lib/api";
import {
  MitigationTemplatePayload,
  mitigationTemplatesResponseSchema,
  templateListCountResponseSchema,
  templateListFilesResponseSchema,
  zoneMutationResponseSchema,
} from "@/types/dashboard";

const BASE = "/api/mitigation-templates";

// javob zonaniki bilan bir xil: { status, message } (+ template, kerak emas)
const checkMutation = (data: unknown) => {
  const res = zoneMutationResponseSchema.parse(data);
  if (res.status === "error") throw new ApiError(res.message);
  return res;
};

export const mitigationTemplatesService = {
  getTemplates: async () => {
    const { data } = await api.get(BASE);
    return mitigationTemplatesResponseSchema.parse(data).templates;
  },

  createTemplate: async (payload: MitigationTemplatePayload) => {
    const { data } = await api.post(BASE, payload);
    return checkMutation(data);
  },

  // nom o'zgartirilsa backend servis va boshqa shablonlardagi havolalarni ham yangilaydi
  updateTemplate: async (name: string, payload: MitigationTemplatePayload) => {
    const { data } = await api.put(`${BASE}/${encodeURIComponent(name)}`, payload);
    return checkMutation(data);
  },

  deleteTemplate: async (name: string) => {
    const { data } = await api.delete(`${BASE}/${encodeURIComponent(name)}`);
    return checkMutation(data);
  },
};

// shablonga bog'langan fayl-ro'yxatlar (har biri o'z papkasida saqlanadi)
export type TemplateListKind = "whitelist" | "blacklist" | "ja4t" | "ja4" | "sni";

// IP ro'yxatlari 'ips', fingerprint/SNI ro'yxatlari 'entries' ishlatadi
const isIpList = (kind: TemplateListKind) =>
  kind === "whitelist" || kind === "blacklist";

const listBase = (kind: TemplateListKind) => `/api/${kind}/tpl`;

export const templateListsService = {
  getFiles: async (kind: TemplateListKind, template: string) => {
    const { data } = await api.get(`${listBase(kind)}/files`, {
      params: { template },
    });
    return templateListFilesResponseSchema.parse(data).files;
  },

  getCount: async (kind: TemplateListKind, template: string) => {
    const { data } = await api.get(
      `${listBase(kind)}/${isIpList(kind) ? "ips" : "entries"}`,
      { params: { template } },
    );
    return templateListCountResponseSchema.parse(data).count;
  },

  // noto'g'ri format (400) va takror (409) javoblari ApiError bo'lib keladi
  upload: async (kind: TemplateListKind, template: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("template", template);
    const { data } = await api.post(`${listBase(kind)}/upload`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return checkMutation(data);
  },

  addManual: async (kind: TemplateListKind, template: string, text: string) => {
    const { data } = await api.post(`${listBase(kind)}/manual`, {
      template,
      [isIpList(kind) ? "ips" : "entries"]: text,
    });
    return checkMutation(data);
  },

  deleteFile: async (
    kind: TemplateListKind,
    template: string,
    filename: string,
  ) => {
    const { data } = await api.post(`${listBase(kind)}/delete`, {
      template,
      filename,
    });
    return checkMutation(data);
  },

  downloadUrl: (kind: TemplateListKind, template: string, filename: string) =>
    `${listBase(kind)}/download?${new URLSearchParams({ template, filename })}`,
};
