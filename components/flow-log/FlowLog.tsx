"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Fingerprint, FileDown, FileText, RefreshCw, Shield, Star } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import CaptureBar from "@/components/flow-log/CaptureBar";
import FlowDetailDialog, { type Detail } from "@/components/flow-log/FlowDetailDialog";
import FlowFilters from "@/components/flow-log/FlowFilters";
import FlowTable, { flowColumns, groupColumns, mitigationColumns } from "@/components/flow-log/FlowTable";
import { useServices, useZones } from "@/hooks/useDashboard";
import { useFlowGroups, useFlowMitigation, useFlowRows, useSaveFlowBaseline } from "@/hooks/useFlowLog";
import {
  CUSTOM,
  DEFAULT_FILTERS,
  commonParams,
  fmtTs,
  flowParams,
  rangeSeconds,
  spansDays,
  type FlowFilters as Filters,
} from "@/lib/flow-log";
import { flowLogService } from "@/service/flow-log.service";

export default function FlowLog() {
  const { t, i18n } = useTranslation();
  const [zone, setZone] = useState("all");
  const [service, setService] = useState("all");
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  // Mitigation — guruh kaliti (Group by, default ip) bo'yicha hujum nomzodlari
  const [mitigation, setMitigation] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), message.error ? 4500 : 3500);
    return () => clearTimeout(id);
  }, [message]);
  const notify = (text: string, error?: boolean) => setMessage({ text, error });

  const zones = useZones();
  const services = useServices(zone);
  const zoneServices = useMemo(() => (zone === "all" ? [] : (services.data ?? [])), [zone, services.data]);

  // JA4 / SNI faqat TLS (yoki barcha servislar) uchun; TCP servisda yashiriladi
  const proto = zoneServices.find((s) => s.serviceName === service)?.protocol;
  const showTls = !proto || proto === "TLS" || proto === "SSL-L4";
  const f = useMemo(() => (showTls ? filters : { ...filters, sni: "", ja4: "" }), [filters, showTls]);

  const by = f.groupBy;
  const mitBy = by || "ip";
  const params = useMemo(
    () => (by || mitigation ? commonParams(zone, service, f) : flowParams(zone, service, f)),
    [by, mitigation, zone, service, f],
  );

  const flowsQ = useFlowRows(params, !by && !mitigation);
  const groupsQ = useFlowGroups(params, by, !mitigation);
  const mitQ = useFlowMitigation(params, mitBy, mitigation);
  const q = mitigation ? mitQ : by ? groupsQ : flowsQ;

  const saveBaseline = useSaveFlowBaseline();

  const errText = (e: Error) => (e.message.startsWith("http.") ? t("misc.noConnectionWithServer") : e.message);

  const rangeItems = [
    { value: "live", label: t("misc.live60s") },
    { value: "5", label: t("misc.last5Minutes") },
    { value: "10", label: t("misc.last10Minutes") },
    { value: "30", label: t("misc.last30Minutes") },
    { value: "60", label: t("misc.last1Hour") },
    { value: "120", label: t("misc.last2Hours") },
    { value: "240", label: t("misc.last4Hours") },
    { value: "720", label: t("misc.last12Hours") },
    { value: "1440", label: t("misc.last24Hours") },
    { value: "2880", label: t("misc.last48Hours") },
    { value: "10080", label: t("misc.last7Days") },
    { value: CUSTOM, label: t("misc.customRange") },
  ];
  const rangeLabel =
    f.range === CUSTOM
      ? `${fmtTs(f.start)} — ${fmtTs(f.end)}`
      : (rangeItems.find((i) => i.value === f.range)?.label ?? "");

  const changeZone = (z: string) => {
    setZone(z);
    setService("all");
  };

  const applyFilters = (next: Filters) => {
    setFilters(next);
    setMitigation(false);
  };

  // yuklab olish joriy ko'rinishga mos: guruhlangan (by bilan) yoki flow ro'yxati
  const exportFile = (kind: "csv" | "pdf") => {
    const p = by ? { ...params, by } : params;
    window.location.href = flowLogService.exportUrl(kind, p, i18n.language);
  };

  const onSaveBaseline = () =>
    saveBaseline.mutate(undefined, {
      onSuccess: (n) => notify(t("flowLog.baselineSaved", { n: n.toLocaleString("en") })),
      onError: (e) => notify(`${t("flowLog.baselineFailed")}: ${errText(e)}`, true),
    });

  // "ko'rsatilgan / jami" — so'rov Rows limiti bilan kesilganini bildiradi
  const shown = mitigation
    ? (mitQ.data?.candidates.length ?? 0)
    : by
      ? (groupsQ.data?.rows.length ?? 0)
      : (flowsQ.data?.rows.length ?? 0);
  const total = mitigation ? (mitQ.data?.count ?? 0) : by ? (groupsQ.data?.total ?? 0) : (flowsQ.data?.total ?? 0);
  const unit = mitigation ? t("flowLog.candidates") : by ? t("misc.groups") : t("misc.rows2");
  const countText = q.data
    ? `${total > shown ? `${shown.toLocaleString("en")} / ${total.toLocaleString("en")}` : shown.toLocaleString("en")} ${unit}`
    : "";

  const ctx = {
    params,
    zone,
    service,
    rangeLabel,
    rangeSec: rangeSeconds(f),
    withDate: spansDays(f),
  };
  // yangi natijada jadval sahifasi birinchisiga qaytadi
  const tableKey = `${mitigation ? "m" : by || "f"}:${q.dataUpdatedAt}`;
  const noData = t("misc.noData2");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent flex h-8 w-8 items-center justify-center rounded-md">
              <Fingerprint size={20} />
            </div>
            <span>{t("misc.flowLogJA4")}</span>
          </CardTitle>
          <CardDescription>{t("misc.perTLSFlowJA4JA4TSNILogging")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CaptureBar
            zones={zones.data ?? []}
            zone={zone}
            onZone={changeZone}
            services={zoneServices}
            service={service}
            onService={setService}
            notify={notify}
          />
        </CardContent>
      </Card>

      {message && (
        <Alert variant={message.error ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <FlowFilters value={filters} onApply={applyFilters} rangeItems={rangeItems} showTls={showTls} />
            <Button variant="outline" disabled={q.isFetching} onClick={() => q.refetch()}>
              <RefreshCw className={q.isFetching ? "animate-spin" : undefined} />
              {t("misc.refresh")}
            </Button>
            <Button variant="outline" onClick={() => exportFile("csv")}>
              <FileDown />
              CSV
            </Button>
            <Button variant="outline" onClick={() => exportFile("pdf")}>
              <FileText />
              PDF
            </Button>
            <Button
              variant={mitigation ? "default" : "outline"}
              title={t("flowLog.mitigationHint")}
              onClick={() => setMitigation((m) => !m)}
            >
              <Shield />
              {t("flowLog.mitigation")}
            </Button>
            <Button
              variant="outline"
              title={t("flowLog.saveNormalHint")}
              disabled={saveBaseline.isPending}
              onClick={onSaveBaseline}
            >
              <Star />
              {t("misc.saveNormal")}
            </Button>
            <span className="text-muted-foreground ml-auto text-xs">
              {rangeLabel}
              {countText && ` · ${countText}`}
            </span>
          </div>

          {q.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{errText(q.error)}</AlertDescription>
            </Alert>
          ) : q.isPending ? (
            <CustomSkeleton />
          ) : mitigation ? (
            <FlowTable
              key={tableKey}
              columns={mitigationColumns(t, mitBy)}
              rows={mitQ.data?.candidates ?? []}
              rowKey={(r) => r.key}
              onRow={(row) => setDetail({ kind: "mitigation", row, by: mitBy })}
              empty={mitQ.data?.baseline_loaded === false ? t("flowLog.noBaseline") : noData}
            />
          ) : by ? (
            <FlowTable
              key={tableKey}
              columns={groupColumns(t, by)}
              rows={groupsQ.data?.rows ?? []}
              rowKey={(r) => r.key}
              onRow={(row) => setDetail({ kind: "group", row, by })}
              empty={noData}
            />
          ) : (
            <FlowTable
              key={tableKey}
              columns={flowColumns(t, showTls)}
              rows={flowsQ.data?.rows ?? []}
              rowKey={(_, i) => String(i)}
              onRow={(row) => setDetail({ kind: "flow", row })}
              empty={noData}
            />
          )}
        </CardContent>
      </Card>

      <FlowDetailDialog detail={detail} ctx={ctx} onClose={() => setDetail(null)} />
    </>
  );
}
