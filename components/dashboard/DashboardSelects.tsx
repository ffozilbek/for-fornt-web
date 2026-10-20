"use client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SelectZones from "../shared/SelectZones";
import { useState } from "react";

export default function DashboardSelects() {
  const { t } = useTranslation();
  const [zone, setZone] = useState("");
  const [service, setService] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("navigation.monitoringByZone")}</CardTitle>
      </CardHeader>
      <CardContent className="flex gap-4">
        <SelectZones
          value={zone}
          onChange={(z) => {
            setZone(z);
            setService("");
          }}
        />
        <ServiceSelect zone={zone} value={service} onChange={setService} />
      </CardContent>
    </Card>
  );
}
