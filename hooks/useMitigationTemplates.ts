import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { geoService } from "@/service/geo.service";
import {
  mitigationTemplatesService,
  TemplateListKind,
  templateListsService,
} from "@/service/mitigation-templates.service";
import { MitigationTemplatePayload } from "@/types/dashboard";

export const useMitigationTemplates = () =>
  useQuery({
    queryKey: queryKeys.dashboard.templates,
    queryFn: mitigationTemplatesService.getTemplates,
    staleTime: 5 * 60 * 1000,
  });

// shablon nomi o'zgarsa servislardagi protectionProfile ham o'zgaradi
const useInvalidateTemplates = () => {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.templates }),
      qc.invalidateQueries({ queryKey: ["dashboard", "services"] }),
    ]);
};

type SaveTemplateInput = {
  // tahrirlanayotgan shablonning eski nomi; yaratishda undefined
  originalName?: string;
  payload: MitigationTemplatePayload;
};

export const useSaveTemplate = () => {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: ({ originalName, payload }: SaveTemplateInput) =>
      originalName
        ? mitigationTemplatesService.updateTemplate(originalName, payload)
        : mitigationTemplatesService.createTemplate(payload),
    onSuccess: invalidate,
  });
};

export const useDeleteTemplate = () => {
  const invalidate = useInvalidateTemplates();
  return useMutation({
    mutationFn: (name: string) =>
      mitigationTemplatesService.deleteTemplate(name),
    onSuccess: invalidate,
  });
};

// fayllar + jami yozuvlar soni; shablon saqlanmaguncha so'ralmaydi
export const useTemplateList = (kind: TemplateListKind, template?: string) =>
  useQuery({
    queryKey: queryKeys.dashboard.templateList(kind, template ?? ""),
    queryFn: async () => {
      const [files, count] = await Promise.all([
        templateListsService.getFiles(kind, template!),
        templateListsService.getCount(kind, template!),
      ]);
      return { files, count };
    },
    enabled: !!template,
  });

export type TemplateListAction =
  | { template: string; action: "upload"; file: File }
  | { template: string; action: "manual"; text: string }
  | { template: string; action: "delete"; filename: string };

export const useTemplateListAction = (kind: TemplateListKind) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: TemplateListAction) => {
      if (a.action === "upload")
        return templateListsService.upload(kind, a.template, a.file);
      if (a.action === "manual")
        return templateListsService.addManual(kind, a.template, a.text);
      return templateListsService.deleteFile(kind, a.template, a.filename);
    },
    // takror bo'lsa ham fayl qisman yozilgan bo'lishi mumkin — doim yangilaymiz
    onSettled: (_d, _e, a) =>
      qc.invalidateQueries({
        queryKey: queryKeys.dashboard.templateList(kind, a.template),
      }),
  });
};

export const useGeoCountries = (enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.geo.countries,
    queryFn: geoService.getCountries,
    staleTime: Infinity,
    enabled,
  });

// forma har ochilganda yangi qiymat bilan boshlanishi uchun keshda saqlanmaydi
export const useTemplateGeo = (template: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.geo.template(template),
    queryFn: () => geoService.getTemplateGeo(template),
    enabled,
    gcTime: 0,
  });

export const useTemplateSmartGeo = (template: string, enabled: boolean) =>
  useQuery({
    queryKey: queryKeys.geo.templateSmart(template),
    queryFn: () => geoService.getTemplateSmartGeo(template),
    enabled,
    gcTime: 0,
  });
