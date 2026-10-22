"use client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SelectZones from "../shared/SelectZones";
import { useState } from "react";
import SelectServices from "../shared/SelectServices";
import { useZones } from "@/hooks/useDashboard";
import CustomSkeleton from "../shared/CustomSkeleton";
import { Alert, AlertDescription } from "../ui/alert";
import SelectProtocols from "../shared/SelectProtocols";
import SelectDisplayType from "../shared/SelectDisplayType";
import TrafficChart from "../charts/TrafficChart";

export default function DashboardSelects() {
  const { t } = useTranslation();
  const [zone, setZone] = useState("all");
  const [service, setService] = useState("all");
  const [protocol, setProtocol] = useState("all");
  const [type, setType] = useState("pps");
  const { data, isPending, isError, error } = useZones();

  if (isPending) return <CustomSkeleton />;
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl text-accent-foreground">
              {t("navigation.monitoringByZone")}
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            {t("navigation.configuredZones")} {data.length}
          </div>
          <div className="flex gap-4">
            <SelectZones
              zones={data}
              value={zone}
              onChange={(z) => {
                setZone(z);
                setService("all");
              }}
            />
            <SelectServices zone={zone} value={service} onChange={setService} />
            <SelectProtocols value={protocol} onChange={setProtocol} />
            <SelectDisplayType value={type} onChange={setType} />
          </div>
        </CardContent>
      </Card>
      <TrafficChart
        zone={zone}
        service={service}
        protocol={protocol}
        type={type}
      />
    </>
  );
}
