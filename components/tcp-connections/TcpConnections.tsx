"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban, Cable, Filter, Network, Users, ZoomOut, Hourglass } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import SelectZones from "@/components/shared/SelectZones";
import StatCard from "@/components/shared/StatCard";
import DomPanel from "@/components/tcp-connections/DomPanel";
import FlagDistributionChart from "@/components/tcp-connections/FlagDistributionChart";
import TcpSeriesChart, { type TcpSeries, type Zoom } from "@/components/tcp-connections/TcpSeriesChart";
import { useServices, useZones } from "@/hooks/useDashboard";
import { useTcpBaseline, useTcpHistory, useTcpLive } from "@/hooks/useTcpIndicators";
import { formatBytes, toLocalInput } from "@/lib/format";
import { formatServiceProto } from "@/lib/service-label";
import {
  CLIENT_FIELDS,
  DOM_MODES,
  SERVER_FIELDS,
  TCP_FAMILY,
  baselineDist,
  buildBaseline,
  computeDoM,
  csum,
  dropRate,
  fmtCard,
  num,
  type DomMode,
  type TcpHistoryRange,
} from "@/lib/tcp-indicators";

const LIVE = "live";
const CUSTOM = "custom";
const HOUR_MS = 3600_000;

function SimpleSelect({
  items,
  value,
  onChange,
  disabled,
  className,
}: {
  items: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className: string;
}) {
  return (
    <Select items={items} value={value} disabled={disabled} onValueChange={(v) => v !== null && onChange(v)}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((i) => (
            <SelectItem key={i.value} value={i.value}>
              {i.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default function TcpConnections() {
  const { t } = useTranslation();
  const [zone, setZone] = useState("all");
  const [service, setService] = useState("all");
  // live | oxirgi N daqiqa | custom
  const [rangeKey, setRangeKey] = useState(LIVE);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [custom, setCustom] = useState<{ start: number; end: number } | null>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [domMode, setDomMode] = useState<DomMode>("static");
  const [zoom, setZoom] = useState<Zoom>(null);

  const zones = useZones();
  const services = useServices(zone);

  const live = rangeKey === LIVE;
  const histRange: TcpHistoryRange | null = live
    ? null
    : rangeKey === CUSTOM
      ? custom
      : { minutes: Number(rangeKey) };

  const liveQ = useTcpLive(zone, service, live);
  const histQ = useTcpHistory(zone, service, histRange);
  const baselineQ = useTcpBaseline(zone, service, domMode);
  const q = live ? liveQ : histQ;

  const points = useMemo(() => (live ? liveQ.data : histQ.data?.points) ?? [], [live, liveQ.data, histQ.data]);
  // o'rganish rejimida javob kelguncha static baseline
  const baseline = useMemo(
    () => buildBaseline(domMode === "static" ? undefined : baselineQ.data),
    [domMode, baselineQ.data],
  );
  const dom = useMemo(
    () => computeDoM(points, live, (histQ.data?.bucketSec ?? 1) * points.length, baseline),
    [points, live, histQ.data, baseline],
  );
  const base = baselineDist(baseline);
  // kartalar — oxirgi soniya (tarixda oxirgi bucket)
  const last = points[points.length - 1]?.d ?? {};

  // tarixda bir kundan uzun yoki kun almashgan oraliq — vaqt sana bilan
  const withDate =
    !live &&
    (rangeKey === CUSTOM
      ? !!custom && new Date(custom.start * 1000).toDateString() !== new Date(custom.end * 1000).toDateString()
      : Number(rangeKey) >= 1440);

  const changeSelection = (fn: () => void) => {
    fn();
    setZoom(null);
  };

  const changeRange = (v: string) =>
    changeSelection(() => {
      setRangeKey(v);
      setRangeError(null);
      if (v === CUSTOM) {
        const now = new Date();
        if (!start) setStart(toLocalInput(new Date(now.getTime() - HOUR_MS)));
        if (!end) setEnd(toLocalInput(now));
      }
    });

  const applyCustom = () => {
    if (!start || !end) return setRangeError(t("misc.pleasePickBothStartAndEndDateTime"));
    const s = Math.floor(new Date(start).getTime() / 1000);
    const e = Math.floor(new Date(end).getTime() / 1000);
    if (e <= s) return setRangeError(t("misc.endMustBeGreaterThanOrEqualToStart"));
    setRangeError(null);
    changeSelection(() => setCustom({ start: s, end: e }));
  };

  const rangeItems = [
    { value: LIVE, label: t("misc.live60s") },
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

  const serviceItems = [
    { value: "all", label: t("misc.allServices") },
    ...(services.data ?? [])
      .filter((s) => TCP_FAMILY.has(s.protocol))
      .map((s) => ({
        value: s.serviceName,
        label: formatServiceProto(s.protocol, s.ports === "any" ? "" : s.ports, s.protocolNumber),
      })),
  ];

  const domItems = DOM_MODES.map((m) => ({
    value: m,
    label: t(
      m === "static"
        ? "misc.staticBestPractice"
        : m === "hour"
          ? "misc.learningLast1Hour"
          : m === "day"
            ? "misc.learningLast1Day"
            : "misc.learningLast1Week",
    ),
  }));

  const series = useMemo(() => {
    const flags = (fields: readonly string[], names: string[], colors: string[]): TcpSeries[] =>
      fields.map((f, i) => ({ key: f, label: names[i], color: colors[i], get: (d) => num(d, f) }));
    return {
      client: [
        ...flags(
          CLIENT_FIELDS,
          ["SYN", "ACK→SYN-ACK", "ACK empty", "ACK data", "PSH-ACK data", "FIN", "RST"],
          ["#ff7b72", "#ffa657", "#e3b341", "#3fb950", "#79c0ff", "#a371f7", "#f85149"],
        ),
        { key: "zero_window", label: t("misc.zeroWindow"), color: "#06b6d4", get: (d) => num(d, "zero_window") },
      ],
      server: flags(
        SERVER_FIELDS,
        ["SYN-ACK", "ACK empty", "ACK data", "PSH-ACK data", "FIN", "RST"],
        ["#ffa657", "#e3b341", "#3fb950", "#79c0ff", "#a371f7", "#f85149"],
      ),
      total: [
        { key: "all", label: t("misc.allTCPClient"), color: "#58a6ff", get: csum },
        { key: "dropped", label: t("misc.dropped"), color: "#f85149", get: (d) => num(d, "dropped") },
      ],
      bytes: [
        { key: "c_bytes", label: t("misc.clientBytesS"), color: "#58a6ff", get: (d) => num(d, "c_bytes") },
        { key: "s_bytes", label: t("misc.serverBytesS"), color: "#d29922", get: (d) => num(d, "s_bytes") },
      ],
      unique: [
        { key: "ips", label: t("misc.uniqueSrcIPs"), color: "#a371f7", get: (d) => num(d, "unique_src_ips") },
        { key: "flows", label: t("misc.uniqueFlows"), color: "#58a6ff", get: (d) => num(d, "unique_src_flows") },
      ],
    } satisfies Record<string, TcpSeries[]>;
  }, [t]);

  const chartProps = { points, withDate, zoom, onZoom: live ? undefined : setZoom };
  const nowInput = toLocalInput(new Date());
  const rangeLabel = rangeItems.find((i) => i.value === rangeKey)?.label;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
              <Cable size={20} />
            </div>
            <span>{t("misc.allTCPConnections")}</span>
          </CardTitle>
          <CardDescription>{t("misc.tCPFlowsUniqueIPsAndDroppedPackets")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <SelectZones
              zones={zones.data ?? []}
              value={zone}
              onChange={(z) =>
                changeSelection(() => {
                  setZone(z);
                  setService("all");
                })
              }
            />
            <SimpleSelect
              items={serviceItems}
              value={service}
              disabled={zone === "all"}
              onChange={(s) => changeSelection(() => setService(s))}
              className="w-full max-w-48"
            />
            <SimpleSelect items={rangeItems} value={rangeKey} onChange={changeRange} className="w-44" />
            {zoom && (
              <Button variant="outline" onClick={() => setZoom(null)}>
                <ZoomOut />
                {t("misc.resetZoom")}
              </Button>
            )}
            <div className="text-muted-foreground ml-auto flex items-center gap-2 text-xs">
              {live ? (
                <>
                  <span className="size-2 animate-pulse rounded-full bg-green-500" />
                  {t("misc.live1s")}
                </>
              ) : (
                `${t("misc.history")} · ${rangeLabel} · ${t("misc.dragScrollToZoom")}`
              )}
            </div>
          </div>

          {rangeKey === CUSTOM && (
            <div className="flex flex-wrap items-end gap-3">
              <Field className="w-auto">
                <FieldLabel htmlFor="tcp-start">{t("misc.started")}</FieldLabel>
                <Input
                  id="tcp-start"
                  type="datetime-local"
                  step={60}
                  max={nowInput}
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </Field>
              <Field className="w-auto">
                <FieldLabel htmlFor="tcp-end">{t("misc.finished")}</FieldLabel>
                <Input
                  id="tcp-end"
                  type="datetime-local"
                  step={60}
                  max={nowInput}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </Field>
              <Button onClick={applyCustom}>
                <Filter />
                {t("misc.apply")}
              </Button>
              {rangeError && <FieldError className="w-full">{rangeError}</FieldError>}
            </div>
          )}
        </CardContent>
      </Card>

      {q.isError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {q.error.message.startsWith("http.") ? t("misc.noConnectionWithServer") : q.error.message}
          </AlertDescription>
        </Alert>
      ) : q.isPending && (live || histRange) ? (
        <CustomSkeleton />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<Users size={20} />}
              value={fmtCard(num(last, "unique_src_ips"))}
              label={t("misc.uniqueSrcIPs")}
              hint={t("misc.perSecond")}
            />
            <StatCard
              icon={<Network size={20} />}
              value={fmtCard(num(last, "unique_src_flows"))}
              label={t("misc.uniqueFlows")}
              hint={t("misc.perSecond")}
            />
            <StatCard
              icon={<Ban size={20} />}
              value={fmtCard(num(last, "dropped"))}
              label={t("misc.dropped")}
              hint={`pps · ${Math.round(dropRate(last))}% ${t("misc.ofClient")}`}
            />
            <StatCard
              icon={<Hourglass size={20} />}
              value={fmtCard(num(last, "zero_window"))}
              label={t("misc.zeroWindow")}
              hint={t("misc.ppsStallIndicator")}
            />
          </div>

          <DomPanel
            view={dom}
            modeSelect={
              <SimpleSelect
                items={domItems}
                value={domMode}
                onChange={(m) => setDomMode(m as DomMode)}
                className="w-56"
              />
            }
          />

          <div className="grid gap-5 xl:grid-cols-2">
            <FlagDistributionChart
              title={t("misc.clientTCPFlagDistributionVsBaseline")}
              current={dom?.dist.client ?? []}
              baseline={base.client}
            />
            <FlagDistributionChart
              title={t("misc.serverTCPFlagDistributionVsBaseline")}
              current={dom?.dist.server ?? []}
              baseline={base.server}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <TcpSeriesChart title={t("misc.clientPacketsClientService")} series={series.client} {...chartProps} />
            <TcpSeriesChart title={t("misc.serverPacketsServiceClient")} series={series.server} {...chartProps} />
            <TcpSeriesChart title={t("misc.allTCPVsDroppedPps")} series={series.total} {...chartProps} />
            <TcpSeriesChart
              title={t("misc.throughputBytesS")}
              series={series.bytes}
              area
              yFmt={formatBytes}
              {...chartProps}
            />
            <TcpSeriesChart title={t("misc.uniqueSourcesPerSecond")} series={series.unique} {...chartProps} />
          </div>
        </>
      )}
    </>
  );
}
