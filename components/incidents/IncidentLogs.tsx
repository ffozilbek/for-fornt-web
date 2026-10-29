"use client";

import { useTranslation } from "react-i18next";
import { History, Siren } from "lucide-react";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useActiveIncidents } from "@/hooks/useIncidents";
import ActiveIncidents from "./ActiveIncidents";
import IncidentHistory from "./IncidentHistory";

const TABS = ["active", "history"] as const;

export default function IncidentLogs() {
  const { t } = useTranslation();
  // tanlangan tab refreshdan keyin ham saqlanadi
  const [tab, setTab] = usePersistedState("incidents.tab", "active", TABS);
  const active = useActiveIncidents();
  const activeCount = active.data?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center">
            <Siren size={20} />
          </div>
          <span>{t("navigation.incidentLogs")}</span>
        </CardTitle>
        <CardAction className="flex gap-1 rounded-lg border p-1">
          <Button
            size="sm"
            variant={tab === "active" ? "default" : "ghost"}
            onClick={() => setTab("active")}
          >
            <Siren />
            {t("navigation.activeIncidents")}
            {activeCount > 0 && (
              <span className="bg-destructive flex size-5 items-center justify-center rounded-full text-[11px] font-semibold text-white">
                {activeCount}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            variant={tab === "history" ? "default" : "ghost"}
            onClick={() => setTab("history")}
          >
            <History />
            {t("navigation.pastIncidents")}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {tab === "active" ? <ActiveIncidents /> : <IncidentHistory />}
      </CardContent>
    </Card>
  );
}
