"use client";
import Image from "next/image";
import { Globe2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LiveMapCanvas from "./LiveMapCanvas";
import { TARGET, useMockLiveMap } from "@/hooks/useMockLiveMap";
import { countryName } from "@/lib/country";
import { formatNumber } from "@/lib/format";

export default function LiveMap() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage ?? i18n.language;
  const points = useMockLiveMap();
  const top = [...points].sort((a, b) => b.packets - a.packets).slice(0, 5);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Globe2Icon size={20} />
          </div>
          <span>{t("navigation.inboundTrafficToAllZonesByCountry")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative overflow-hidden rounded-lg">
          <LiveMapCanvas points={points} target={TARGET} />
          <ul className="absolute bottom-3 left-3 space-y-1 rounded-md bg-background/70 p-2 text-xs backdrop-blur">
            {top.map((p) => (
              <li key={p.code} className="flex items-center gap-2">
                <Image
                  src={`/flags/${p.code}.svg`}
                  alt={p.code}
                  width={16}
                  height={16}
                  unoptimized
                />
                <span className="text-muted-foreground">
                  {countryName(p.code, lang, p.name)}
                </span>
                <span className="ml-auto pl-3 font-mono">
                  {formatNumber(p.packets)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
