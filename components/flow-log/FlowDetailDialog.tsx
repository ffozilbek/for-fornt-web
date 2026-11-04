"use client";

import { useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomSkeleton from "@/components/shared/CustomSkeleton";
import DomPanel from "@/components/tcp-connections/DomPanel";
import TcpSeriesChart, {
  type TcpSeries,
  type Zoom,
} from "@/components/tcp-connections/TcpSeriesChart";
import { SimpleSelect } from "@/components/flow-log/CaptureBar";
import {
  CountryCell,
  DirectionBars,
  MetaGrid,
  Mono,
  VerdictText,
} from "@/components/flow-log/FlowBits";
import { driversText } from "@/components/flow-log/FlowTable";
import { useFlowSeries } from "@/hooks/useFlowLog";
import { useTcpBaseline } from "@/hooks/useTcpIndicators";
import { formatBytes } from "@/lib/format";
import {
  C_FLAGS,
  C_TLS,
  S_FLAGS,
  S_TLS,
  fmtInt,
  fmtTs,
  isFpGroup,
  isTlsGroup,
  num,
  toTcpRecord,
  type FlowParams,
  type GroupBy,
} from "@/lib/flow-log";
import {
  DOM_MODES,
  buildBaseline,
  computeDoM,
  type DomMode,
} from "@/lib/tcp-indicators";
import type {
  FlowGroupRow,
  FlowMitigationRow,
  FlowRow,
} from "@/types/dashboard";
import { Separator } from "../ui/separator";

export type Detail =
  | { kind: "flow"; row: FlowRow }
  | { kind: "group"; row: FlowGroupRow; by: GroupBy }
  | { kind: "mitigation"; row: FlowMitigationRow; by: GroupBy };

type Ctx = {
  params: FlowParams; // joriy so'rov filtrlari (series ham shu oraliqda)
  zone: string;
  service: string;
  rangeLabel: string;
  rangeSec: number;
  withDate: boolean;
};

const COLORS = {
  syn: "#ff7b72",
  synack: "#ffa657",
  ack: "#e3b341",
  data: "#3fb950",
  psh: "#79c0ff",
  fin: "#a371f7",
  rst: "#f85149",
  zw: "#06b6d4",
};

// guruh kaliti bo'yicha vaqt qatorlari (active sessions sahifasi uslubida)
function GroupSeries({
  ctx,
  by,
  rowKey,
  tls,
}: {
  ctx: Ctx;
  by: GroupBy;
  rowKey: string;
  tls: boolean;
}) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState<Zoom>(null);
  const q = useFlowSeries(ctx.params, by, rowKey);
  const bucket = Math.max(1, q.data?.bucket_sec ?? 1);
  const points = useMemo(
    () => (q.data?.rows ?? []).map((d) => ({ t: num(d, "bts") * 1000, d })),
    [q.data],
  );

  const charts = useMemo(() => {
    const s = (
      key: string,
      label: string,
      color: string,
      rate = false,
    ): TcpSeries => ({
      key,
      label,
      color,
      get: (d) => (rate ? num(d, key) / bucket : num(d, key)),
    });
    const list: {
      title: string;
      series: TcpSeries[];
      area?: boolean;
      bytes?: boolean;
    }[] = [
      {
        title: t("flowLog.clientFlags"),
        series: [
          s("c_syn", "SYN", COLORS.syn),
          s("c_ack_empty", "ACK empty", COLORS.ack),
          s("c_ack_data", "ACK data", COLORS.data),
          s("c_psh_ack_data", "PSH-ACK data", COLORS.psh),
          s("c_fin_ack", "FIN", COLORS.fin),
          s("c_rst", "RST", COLORS.rst),
          s("zero_window", t("misc.zeroWindow"), COLORS.zw),
        ],
      },
      {
        title: t("flowLog.serverFlags"),
        series: [
          s("s_syn_ack", "SYN-ACK", COLORS.synack),
          s("s_ack_empty", "ACK empty", COLORS.ack),
          s("s_ack_data", "ACK data", COLORS.data),
          s("s_psh_ack_data", "PSH-ACK data", COLORS.psh),
          s("s_fin_ack", "FIN", COLORS.fin),
          s("s_rst", "RST", COLORS.rst),
        ],
      },
    ];
    if (tls)
      list.push(
        {
          title: t("flowLog.clientToServiceTls"),
          series: [
            s("c_client_hello", "ClientHello", "#d29922"),
            s("c_ccs", "CCS", COLORS.data),
            s("c_app_data_records", "AppData", COLORS.psh),
            s("c_alert", "Alert", COLORS.rst),
            s("renegotiation_count", "Reneg", "#bc8cff"),
          ],
        },
        {
          title: t("flowLog.serviceToClientTls"),
          series: [
            s("s_server_hello", "ServerHello", COLORS.synack),
            s("s_ccs", "CCS", COLORS.data),
            s("s_app_data_records", "AppData", COLORS.psh),
            s("s_alert", "Alert", COLORS.rst),
          ],
        },
      );
    // flowlar — bucket boshiga son (uzun oraliqda /s 0 ga yaxlitlanib ketadi)
    const flows = [s("flows", t("misc.flows"), "#58a6ff")];
    if (by !== "ip") flows.push(s("uips", t("misc.uniqueSrcIPs"), "#a371f7"));
    list.push(
      {
        title: t("misc.throughputBytesS"),
        area: true,
        bytes: true,
        series: [
          s("fwd_bytes", "Fwd bytes/s", "#58a6ff", true),
          s("bwd_bytes", "Bwd bytes/s", "#d29922", true),
        ],
      },
      {
        title:
          by === "ip" ? t("flowLog.flowsOverTime") : t("flowLog.flowsAndIps"),
        series: flows,
      },
    );
    return list;
  }, [t, tls, by, bucket]);

  if (q.isPending) return <CustomSkeleton />;
  if (q.isError)
    return <p className="text-destructive text-sm">{q.error.message}</p>;

  return (
    <div className="space-y-2">
      {zoom && (
        <Button variant="outline" size="sm" onClick={() => setZoom(null)}>
          <ZoomOut />
          {t("misc.resetZoom")}
        </Button>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {charts.map((c) => (
          <TcpSeriesChart
            key={c.title}
            title={c.title}
            series={c.series}
            points={points}
            area={c.area}
            yFmt={c.bytes ? formatBytes : undefined}
            withDate={ctx.withDate}
            zoom={zoom}
            onZoom={setZoom}
          />
        ))}
      </div>
    </div>
  );
}

// guruh qatorining DoM xulosasi (TCP indikatorlari baseline'i bilan)
function GroupDom({
  ctx,
  row,
  by,
}: {
  ctx: Ctx;
  row: FlowGroupRow;
  by: GroupBy;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<DomMode>("static");
  const baselineQ = useTcpBaseline(ctx.zone, ctx.service, mode);
  const view = useMemo(() => {
    const baseline = buildBaseline(
      mode === "static" ? undefined : baselineQ.data,
    );
    return computeDoM(
      [{ t: 0, d: toTcpRecord(row) }],
      false,
      ctx.rangeSec,
      baseline,
      by === "ip",
    );
  }, [row, by, ctx.rangeSec, mode, baselineQ.data]);

  const items = DOM_MODES.map((m) => ({
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

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{t("flowLog.attackAnalysis")}</h3>
      <DomPanel
        view={view}
        modeSelect={
          <SimpleSelect
            items={items}
            value={mode}
            onChange={(m) => setMode(m as DomMode)}
            className="w-56"
          />
        }
      />
    </div>
  );
}

function FlagSections({ row, tls }: { row: object; tls: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      <DirectionBars
        row={row}
        client={{
          title: t("flowLog.clientToService"),
          spec: C_FLAGS,
          color: "#3fb950",
        }}
        server={{
          title: t("flowLog.serviceToClient"),
          spec: S_FLAGS,
          color: "#58a6ff",
        }}
        empty={t("flowLog.noFlagData")}
      />
      {tls && (
        <DirectionBars
          row={row}
          client={{
            title: t("flowLog.clientToServiceTls"),
            spec: C_TLS,
            color: "#d29922",
          }}
          server={{
            title: t("flowLog.serviceToClientTls"),
            spec: S_TLS,
            color: "#bc8cff",
          }}
          empty={t("flowLog.noTlsData")}
        />
      )}
    </>
  );
}

const tlsMeta = (r: object, t: TFunction) =>
  [
    [
      t("flowLog.tlsBytes"),
      `${formatBytes(num(r, "c_tls_bytes"))} / ${formatBytes(num(r, "s_tls_bytes"))}`,
    ],
    [
      t("flowLog.clientHelloSni"),
      `${fmtInt(num(r, "c_client_hello"))} / ${fmtInt(num(r, "ch_sni_count"))}`,
    ],
    [t("flowLog.renegotiations"), fmtInt(num(r, "renegotiation_count"))],
  ] as [string, string][];

function Body({ detail, ctx }: { detail: Detail; ctx: Ctx }) {
  const { t } = useTranslation();
  const bp = (b: number, p: number) => `${formatBytes(b)} / ${fmtInt(p)} pkts`;

  if (detail.kind === "flow") {
    const r = detail.row;
    return (
      <>
        <MetaGrid
          items={[
            [t("misc.time"), fmtTs(r.ts)],
            [t("misc.duration2"), `${fmtInt(r.duration_ms)} ms`],
            [
              t("flowLog.zoneService"),
              `${r.zone_name} / ${r.service_name || "—"}`,
            ],
            [t("misc.country"), <CountryCell key="cc" code={r.country} />],
            ["JA4", <Mono key="ja4">{r.ja4}</Mono>],
            ["JA4T", <Mono key="ja4t">{r.ja4t}</Mono>],
            ["SNI", r.sni || "—"],
            ["fwd", bp(r.fwd_bytes, r.fwd_pkts)],
            ["bwd", bp(r.bwd_bytes, r.bwd_pkts)],
            ...tlsMeta(r, t),
            [
              t("flowLog.resumed"),
              num(r, "resume_connection") ? t("flowLog.yes") : t("flowLog.no"),
            ],
            [t("flowLog.zeroWindow"), fmtInt(num(r, "zero_window"))],
            [t("misc.dropped"), fmtInt(num(r, "dropped"))],
            [t("misc.end2"), r.end_reason || "—"],
            [t("misc.timeRange4"), ctx.rangeLabel],
          ]}
        />
        <FlagSections row={r} tls />
      </>
    );
  }

  if (detail.kind === "group") {
    const { row: r, by } = detail;
    const tls = isTlsGroup(by);
    const items: [string, React.ReactNode][] = [
      [t("misc.flows"), fmtInt(r.flows)],
      [t("misc.srcIPs"), fmtInt(r.src_ips)],
      ["JA4", fmtInt(r.ja4s)],
      ["JA4T", fmtInt(r.ja4ts)],
      ["fwd", bp(r.fwd_bytes, r.fwd_pkts)],
      ["bwd", bp(r.bwd_bytes, r.bwd_pkts)],
      [t("flowLog.zeroWindow"), fmtInt(num(r, "zero_window"))],
      [t("misc.dropped"), fmtInt(num(r, "dropped"))],
    ];
    if (tls)
      items.push([t("misc.tLSFlows"), fmtInt(r.tls_flows)], ...tlsMeta(r, t), [
        t("flowLog.resumedFlows"),
        fmtInt(num(r, "resume_connection")),
      ]);
    items.push(
      isFpGroup(by)
        ? [t("misc.countries"), fmtInt(r.countries)]
        : [t("misc.country"), <CountryCell key="cc" code={r.country} />],
      [t("misc.lastSeen"), fmtTs(r.last_ts)],
      [t("misc.timeRange4"), ctx.rangeLabel],
    );
    return (
      <>
        <MetaGrid items={items} />
        {tls && r.snis.length > 0 && (
          <MetaGrid items={[[t("flowLog.snis"), r.snis.join(", ")]]} />
        )}
        <GroupSeries ctx={ctx} by={by} rowKey={r.key} tls={tls} />
        <GroupDom ctx={ctx} row={r} by={by} />
        <FlagSections row={r} tls={tls} />
      </>
    );
  }

  const { row: r, by } = detail;
  const items: [string, React.ReactNode][] = [
    [
      t("flowLog.verdict"),
      <span key="v">
        <VerdictText verdict={r.verdict} /> · DoA {r.score}
      </span>,
    ],
    [t("flowLog.attackType"), r.attack_type || "—"],
    [t("flowLog.triggerWindow"), r.window],
    [t("flowLog.peakFlows"), fmtInt(r.peak_flows)],
    [t("misc.flowRate"), `${r.flow_rate.toLocaleString("en")}/s`],
  ];
  if (by !== "ip") items.push([t("misc.srcIPs"), fmtInt(r.uips)]);
  if (by !== "country")
    items.push([t("misc.country"), <CountryCell key="cc" code={r.country} />]);
  items.push(
    [t("flowLog.peakTime"), fmtTs(r.peak_ts)],
    [t("misc.timeRange4"), ctx.rangeLabel],
  );
  return (
    <>
      <MetaGrid items={items} />
      <MetaGrid items={[[t("flowLog.drivers"), driversText(r)]]} />
      {r.dofs.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t("flowLog.ruleDoF")}</h3>
          {[...r.dofs]
            .sort((a, b) => b.dof - a.dof)
            .map((x) => (
              <div
                key={x.attack}
                className="grid grid-cols-[14rem_auto] gap-2 text-xs"
              >
                <span>{x.attack}</span>
                <span className="text-muted-foreground tabular-nums">
                  DoF {x.dof}
                </span>
              </div>
            ))}
        </div>
      )}
      <GroupSeries ctx={ctx} by={by} rowKey={r.key} tls={false} />
    </>
  );
}

function Title({ detail }: { detail: Detail }) {
  if (detail.kind === "flow") {
    const r = detail.row;
    return (
      <Mono>{`${r.src_ip}:${r.src_port} → ${r.dst_ip}:${r.dst_port}`}</Mono>
    );
  }
  return detail.by === "country" ? (
    <CountryCell code={detail.row.key} />
  ) : (
    <Mono>{detail.row.key}</Mono>
  );
}

// qator detali: flow — flag/TLS taqsimoti; guruh — vaqt qatorlari, DoM;
// mitigation — xulosa omillari va vaqt qatorlari
export default function FlowDetailDialog({
  detail,
  ctx,
  onClose,
}: {
  detail: Detail | null;
  ctx: Ctx;
  onClose: () => void;
}) {
  return (
    <Dialog open={detail !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl">
        {detail && (
          <>
            <DialogHeader>
              <DialogTitle>
                <Title detail={detail} />
              </DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="space-y-5">
              <Body detail={detail} ctx={ctx} />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { Ctx as DetailCtx };
