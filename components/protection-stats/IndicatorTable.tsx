"use client";

import { useTranslation } from "react-i18next";
import { TableProperties } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBits, formatNumber } from "@/lib/format";
import { Indicator, indicatorLabel } from "@/lib/protection-stats";

type Props = { items: Indicator[]; totalPackets: number; totalBits: number };

// barcha indikatorlar: tashlangan paketlar va bitlar
export default function IndicatorTable({ items, totalPackets, totalBits }: Props) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <TableProperties size={20} />
          </div>
          <span>{t("misc.protectionIndicatorsPacketTypeBreakdown")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("misc.indicatorPacketType")}</TableHead>
              <TableHead className="text-right">{t("misc.droppedPackets")}</TableHead>
              <TableHead className="text-right">{t("misc.droppedBits")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.key}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: it.color }} />
                    {indicatorLabel(it.key, t)}
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatNumber(it.packets)}</TableCell>
                <TableCell className="text-right font-mono tabular-nums">{formatBits(it.bits)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>{t("misc.tOTAL")}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatNumber(totalPackets)}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{formatBits(totalBits)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
