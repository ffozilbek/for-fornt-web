"use client";

import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  BANDWIDTH_UNITS,
  BoolKey,
  NumKey,
  RATE_GROUPS,
  RateGroup,
  TemplateValues,
  TLS_VERSIONS,
} from "@/lib/mitigation-templates";
import { TemplateListKind } from "@/service/mitigation-templates.service";
import {
  MitigationTemplate,
  TemplateGeo,
  TemplateSmartGeo,
} from "@/types/dashboard";
import CountryPicker from "./CountryPicker";
import TemplateListPanel, { Notice } from "./TemplateListPanel";

type Props = {
  type: string;
  values: TemplateValues;
  onChange: (patch: Partial<TemplateValues>) => void;
  // barcha shablonlar — Basic/TCP/UDP biriktirish selectlari uchun
  templates: MitigationTemplate[];
  // fayl-ro'yxatlar uchun: saqlangan shablon nomi (yaratishda undefined)
  savedName?: string;
  ensureSaved: () => Promise<string | null>;
  onNotice: (n: Notice) => void;
  // BASIC turidagi Geo / Smart Geo (backend json faylida saqlanadi)
  geo: TemplateGeo;
  onGeoChange: (patch: Partial<TemplateGeo>) => void;
  smartGeo: TemplateSmartGeo;
  onSmartGeoChange: (patch: Partial<TemplateSmartGeo>) => void;
};

// bo'limlar boshida yopiq turadi, foydalanuvchi keraklisini ochadi
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Collapsible className="rounded-lg border">
      <CollapsibleTrigger className="hover:bg-muted/50 flex w-full cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm font-medium [&[data-panel-open]>svg]:rotate-90">
        <ChevronRight className="text-muted-foreground size-4 shrink-0 transition-transform" />
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-3 border-t px-3 py-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// yoqilgan toggle ostidagi parametrlar bloki
function SubBlock({ children }: { children: ReactNode }) {
  return (
    <div className="bg-muted/40 flex flex-col gap-3 rounded-md p-3">
      {children}
    </div>
  );
}

export default function TemplateSections({
  type,
  values: v,
  onChange,
  templates,
  savedName,
  ensureSaved,
  onNotice,
  geo,
  onGeoChange,
  smartGeo,
  onSmartGeoChange,
}: Props) {
  const { t } = useTranslation();

  const listPanel = (kind: TemplateListKind) => (
    <SubBlock>
      <TemplateListPanel
        kind={kind}
        template={savedName}
        ensureSaved={ensureSaved}
        onNotice={onNotice}
      />
    </SubBlock>
  );

  const toggle = (key: BoolKey, label: string, hint?: string) => (
    <Field orientation="horizontal">
      <FieldContent>
        <FieldLabel htmlFor={`tpl-${key}`}>{label}</FieldLabel>
        {hint && <FieldDescription>{hint}</FieldDescription>}
      </FieldContent>
      <Switch
        id={`tpl-${key}`}
        checked={v[key]}
        onCheckedChange={(checked) => onChange({ [key]: checked })}
      />
    </Field>
  );

  // 0 bo'sh ko'rinadi — foydalanuvchi maydonni tozalab yoza olsin
  const number = (key: NumKey, label: string, max?: number) => (
    <Field>
      <FieldLabel htmlFor={`tpl-${key}`}>{label}</FieldLabel>
      <Input
        id={`tpl-${key}`}
        type="number"
        min={1}
        max={max}
        inputMode="numeric"
        value={v[key] ? String(v[key]) : ""}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange({ [key]: Number.isFinite(n) ? n : 0 });
        }}
      />
    </Field>
  );

  const rateLimit = (g: RateGroup, enableLabel: string) => (
    <SubBlock>
      {toggle(g.enable, enableLabel)}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {number(g.rate, t("misc.tokenRatePps"))}
        {number(g.capacity, t("misc.tokenCapacity"))}
        {number(g.duration, t("misc.blockDurationS"))}
        {number(g.threshold, t("misc.violationThreshold"))}
      </div>
    </SubBlock>
  );

  const session = () => (
    <Section title={t("misc.sessionManagement")}>
      {toggle(
        "sessionEnable",
        t("misc.sessionLimit"),
        t("navigation.perSourceAndPerZoneSessionCountsAreLimit"),
      )}
      {v.sessionEnable && (
        <SubBlock>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {number("srcSessionCount", t("misc.srcSessionCount"))}
            {number("allSessionCount", t("misc.allSessionCount"))}
            {number("deleteSessionTime", t("misc.deleteSessionTimeS"))}
          </div>
        </SubBlock>
      )}
    </Section>
  );

  const templateSelect = (
    key: "basicTemplateName" | "tcpTemplateName" | "udpTemplateName",
    templateType: string,
    label: string,
  ) => {
    const items = templates
      .filter((tpl) => tpl.templateType === templateType)
      .map((tpl) => ({
        value: tpl.templateName as string | null,
        label: tpl.templateName,
      }));
    // backenddagi shablon o'chirilgan bo'lsa ham joriy qiymat ko'rinib tursin
    if (v[key] && !items.some((i) => i.value === v[key]))
      items.push({ value: v[key], label: `${v[key]} ${t("errors.notFound")}` });
    const all = [{ value: null, label: t("misc.select") }, ...items];
    return (
      <SubBlock>
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <Select
            items={all}
            value={v[key] || null}
            onValueChange={(val) => onChange({ [key]: val ?? "" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("misc.select")} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {all.map((i) => (
                  <SelectItem key={i.value ?? ""} value={i.value}>
                    {i.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </SubBlock>
    );
  };

  const tcpAttach = () => (
    <Section title={t("misc.attachTCPProtection")}>
      {toggle(
        "tcpTemplateEnable",
        t("misc.attachTCPTemplate"),
        t("misc.theSelectedTCPTemplateAppliesItsProtecti"),
      )}
      {v.tcpTemplateEnable &&
        templateSelect("tcpTemplateName", "TCP", t("misc.tCPProtectionTemplate"))}
    </Section>
  );

  const udpAttach = () => (
    <Section title={t("misc.attachUDPProtection")}>
      {toggle(
        "udpTemplateEnable",
        t("misc.attachUDPTemplate"),
        t("misc.theSelectedUDPTemplateAppliesItsProtecti"),
      )}
      {v.udpTemplateEnable &&
        templateSelect("udpTemplateName", "UDP", t("misc.uDPProtectionTemplate"))}
    </Section>
  );

  // biriktirilgan TCP/UDP shablonda basic bo'lsa, o'shaniki ishlatiladi —
  // bu yerdagi Basic bo'limi yashiriladi
  const attachedHasBasic = (enabled: boolean, name: string) =>
    enabled &&
    !!name &&
    !!templates.find((tpl) => tpl.templateName === name)?.basicTemplateEnable;
  const hideBasic =
    attachedHasBasic(v.tcpTemplateEnable, v.tcpTemplateName) ||
    attachedHasBasic(v.udpTemplateEnable, v.udpTemplateName);

  const basicAttach = () =>
    !hideBasic && (
      <Section title={t("misc.attachBasicProtection")}>
        {toggle(
          "basicTemplateEnable",
          t("misc.attachBasicTemplate"),
          t("misc.ifEnabledABasicProtectionTemplateIsSelec"),
        )}
        {v.basicTemplateEnable &&
          templateSelect(
            "basicTemplateName",
            "BASIC",
            t("misc.basicProtectionTemplate"),
          )}
      </Section>
    );

  switch (type) {
    case "BASIC":
      return (
        <>
          <Section title={t("misc.iPBandwidth")}>
            {toggle(
              "checkIpHeaderMalformed",
              t("misc.checkIPHeaderMalformed"),
              t("misc.checkIPv4Header"),
            )}
            {toggle(
              "bandwidthEnable",
              t("misc.bandwidthManagement"),
              t("misc.limitTrafficRate"),
            )}
            {v.bandwidthEnable && (
              <SubBlock>
                <div className="grid grid-cols-2 gap-3">
                  {number("bandwidthRate", t("misc.rateValue"))}
                  <Field>
                    <FieldLabel>{t("misc.unit")}</FieldLabel>
                    <Select
                      items={BANDWIDTH_UNITS.map((u) => ({ value: u, label: u }))}
                      value={v.bandwidthUnit}
                      onValueChange={(u) => u && onChange({ bandwidthUnit: u })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {BANDWIDTH_UNITS.map((u) => (
                            <SelectItem key={u} value={u}>
                              {u}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </SubBlock>
            )}
          </Section>
          <Section title={t("misc.geoFilter")}>
            {toggle(
              "geoFilterEnable",
              t("misc.geoFilterEnable"),
              t("misc.filterTrafficByCountry"),
            )}
            {v.geoFilterEnable && (
              <SubBlock>
                <CountryPicker
                  id="tpl-geo"
                  mode={geo.mode}
                  countries={geo.countries}
                  onChange={onGeoChange}
                />
              </SubBlock>
            )}
          </Section>
          <Section title={t("misc.smartGeoFilter")}>
            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="tpl-smartGeo">
                  {t("misc.smartGeoFilterEnable")}
                </FieldLabel>
                <FieldDescription>
                  {t("misc.aGeoRuleThatRunsOnlyDuringTheSetTimeWind")}
                </FieldDescription>
              </FieldContent>
              <Switch
                id="tpl-smartGeo"
                checked={smartGeo.enabled}
                onCheckedChange={(enabled) => onSmartGeoChange({ enabled })}
              />
            </Field>
            {smartGeo.enabled && (
              <SubBlock>
                <div className="grid grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel htmlFor="tpl-smart-start">
                      {t("misc.startTimeHHMM")}
                    </FieldLabel>
                    <Input
                      id="tpl-smart-start"
                      type="time"
                      value={smartGeo.start}
                      onChange={(e) =>
                        onSmartGeoChange({ start: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="tpl-smart-end">
                      {t("misc.endTimeHHMM")}
                    </FieldLabel>
                    <Input
                      id="tpl-smart-end"
                      type="time"
                      value={smartGeo.end}
                      onChange={(e) => onSmartGeoChange({ end: e.target.value })}
                    />
                  </Field>
                </div>
                <FieldDescription>
                  {t("misc.theTimeWindowIsDefinedByThisPairEG220006")}
                </FieldDescription>
                <CountryPicker
                  id="tpl-smart"
                  mode={smartGeo.mode}
                  countries={smartGeo.countries}
                  onChange={onSmartGeoChange}
                />
              </SubBlock>
            )}
          </Section>
          <Section title={t("misc.whitelistManagement")}>
            {toggle(
              "whitelistEnable",
              t("misc.whitelistEnable"),
              t("misc.iPCIDRsInThisListBypassAllChecksPassThro"),
            )}
            {v.whitelistEnable && listPanel("whitelist")}
          </Section>
          <Section title={t("misc.blacklistManagement")}>
            {toggle(
              "blacklistEnable",
              t("misc.blacklistEnable"),
              t("misc.iPCIDRsInThisListAreBlockedImmediatelyWi"),
            )}
            {v.blacklistEnable && listPanel("blacklist")}
          </Section>
        </>
      );

    case "TCP":
      return (
        <>
          <Section title={t("misc.tCPProtectionChecks")}>
            {toggle(
              "synCookieEnable",
              "SYN Cookie",
              t("misc.sYNFloodProtectionDefaultOn"),
            )}
            {toggle(
              "checkTcpMalformed",
              t("misc.checkTCPMalformed"),
              t("misc.checkTCPHeaderDefaultOn"),
            )}
            {toggle(
              "checkTcpConnTracking",
              t("misc.checkTCPConnectionTracking"),
              t("misc.flowTableStateCheckDefaultOn"),
            )}
          </Section>
          <Section title={t("misc.tCPTrigger")}>
            {toggle(
              "tcpTriggerEnable",
              t("misc.tCPTrigger"),
              t("misc.ifEnabledProtectionSYNCookieFlowTracking"),
            )}
            {v.tcpTriggerEnable && (
              <SubBlock>
                {number(
                  "tcpTriggerThreshold",
                  t("misc.tCPTriggerThresholdPps"),
                  2147483647,
                )}
              </SubBlock>
            )}
          </Section>
          <Section title={t("misc.rateLimitTCPFlags")}>
            {rateLimit(RATE_GROUPS.tcpSyn, t("misc.tCPSYNFlagEnable"))}
            {rateLimit(RATE_GROUPS.tcpFin, t("misc.tCPFINFlagEnable"))}
            {rateLimit(RATE_GROUPS.tcpUrg, t("misc.tCPURGFlagEnable"))}
            {rateLimit(RATE_GROUPS.tcpOther, t("misc.tCPOtherFlagsOtherEnable"))}
            <FieldDescription>
              {t("misc.noteRateLimitAppliesOnlyToPacketsThatPas")}
            </FieldDescription>
          </Section>
          {session()}
          <Section title={t("misc.checkBlacklistJA4T")}>
            {toggle(
              "ja4tBlacklistEnable",
              t("misc.checkBlacklistJA4T"),
              t("misc.packetsArrivingWithAJA4TTCPSYNFingerprin"),
            )}
            {v.ja4tBlacklistEnable && listPanel("ja4t")}
          </Section>
          {basicAttach()}
        </>
      );

    case "UDP":
      return (
        <>
          <Section title={t("misc.uDPProtectionChecks")}>
            {toggle(
              "checkUdpMalformed",
              t("misc.checkUDPMalformed"),
              t("misc.checkUDPHeaderDefaultOn"),
            )}
          </Section>
          <Section title={t("misc.rateLimitUDP")}>
            {rateLimit(RATE_GROUPS.udp, t("misc.uDPEnable"))}
          </Section>
          {session()}
          {basicAttach()}
        </>
      );

    case "ICMP":
      return (
        <>
          <Section title={t("misc.iCMPProtectionChecks")}>
            {toggle(
              "checkIcmpMalformed",
              t("misc.checkICMPMalformed"),
              t("misc.checkICMPHeaderDefaultOn"),
            )}
          </Section>
          <Section title={t("misc.rateLimitICMP")}>
            {rateLimit(RATE_GROUPS.icmp, t("misc.iCMPEnable"))}
          </Section>
          {basicAttach()}
        </>
      );

    case "TLS":
      return (
        <>
          <Section title={t("misc.tLSProtection")}>
            {toggle("checkTlsMalformed", t("misc.checkTLSMalformed"))}
            <TlsVersions
              mask={v.tlsAllowedVersions}
              onChange={(mask) => onChange({ tlsAllowedVersions: mask })}
            />
          </Section>
          <Section title={t("misc.sNIAllowlist")}>
            {toggle("sniAllowlistEnable", t("misc.sNIAllowlistEnable"))}
            {v.sniAllowlistEnable && listPanel("sni")}
          </Section>
          <Section title={t("misc.checkBlacklistJA4")}>
            {toggle(
              "ja4BlacklistEnable",
              t("misc.checkBlacklistJA4"),
              t("misc.packetsArrivingWithAJA4TLSClientHelloFin"),
            )}
            {v.ja4BlacklistEnable && listPanel("ja4")}
          </Section>
          {tcpAttach()}
          {basicAttach()}
        </>
      );

    case "DNS-TCP":
      return (
        <>
          <Section title={t("misc.dNSTCPProtection")}>
            {toggle(
              "checkDnsTcpMalformed",
              t("misc.checkDNSTCPMalformedPackets"),
              t("misc.checkDNSQueryDefaultOn"),
            )}
          </Section>
          {tcpAttach()}
          {basicAttach()}
        </>
      );

    case "DNS-UDP":
      return (
        <>
          <Section title={t("misc.dNSUDPProtection")}>
            {toggle(
              "checkDnsUdpMalformed",
              t("misc.checkDNSUDPMalformedPackets"),
              t("misc.checkDNSQueryDefaultOn"),
            )}
          </Section>
          {udpAttach()}
          {basicAttach()}
        </>
      );

    case "QUIC":
      return (
        <>
          <Section title={t("misc.qUICProtection")}>
            {toggle(
              "checkQuicMalformed",
              t("misc.checkQUICMalformedPackets"),
              t("misc.checkQUICPacketDefaultOn"),
            )}
          </Section>
          {udpAttach()}
          {basicAttach()}
        </>
      );

    case "OTHER":
      return (
        <>
          <Section title={t("misc.rateLimitOtherProtocolNumber")}>
            {rateLimit(RATE_GROUPS.other, t("misc.otherEnable"))}
          </Section>
          {basicAttach()}
        </>
      );

    default:
      return null;
  }
}

// mask: 0 = All (versiya tekshirilmaydi). "All" belgilanganda maxsus
// versiyalar o'chiq turadi; "All" olib tashlansa foydalanuvchi keraklisini
// belgilaydi, oxirgi maxsus versiya ham olinsa yana "All" bo'ladi.
function TlsVersions({
  mask,
  onChange,
}: {
  mask: number;
  onChange: (mask: number) => void;
}) {
  const { t } = useTranslation();
  const [picking, setPicking] = useState(false);
  const all = mask === 0 && !picking;

  return (
    <SubBlock>
      <FieldLabel>{t("misc.allowedTLSVersions")}</FieldLabel>
      <div className="flex flex-wrap gap-4">
        <Label className="cursor-pointer font-normal">
          <Checkbox
            checked={all}
            onCheckedChange={(checked) => {
              setPicking(!checked);
              if (checked) onChange(0);
            }}
          />
          {t("misc.allDoNotCheckVersion")}
        </Label>
        {TLS_VERSIONS.map(({ bit, label }) => (
          <Label key={bit} className="cursor-pointer font-normal">
            <Checkbox
              checked={(mask & bit) !== 0}
              disabled={all}
              onCheckedChange={(checked) => {
                const next = checked ? mask | bit : mask & ~bit;
                setPicking(next !== 0);
                onChange(next);
              }}
            />
            {label}
          </Label>
        ))}
      </div>
      <FieldDescription>
        {t("misc.onlyTheCheckedTLSVersionsPassOthersAreDr")}
      </FieldDescription>
    </SubBlock>
  );
}
