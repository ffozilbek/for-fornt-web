"use client";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import SelectZones from "../shared/SelectZones";
import SelectServices from "../shared/SelectServices";
import { useServices, useZones } from "@/hooks/useDashboard";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SERVICE_NONE, SERVICE_RESPONSE } from "@/lib/constants";
import CustomSkeleton from "../shared/CustomSkeleton";
import { Alert, AlertDescription } from "../ui/alert";
import SelectProtocols from "../shared/SelectProtocols";
import SelectDisplayType from "../shared/SelectDisplayType";
import TrafficChart from "../charts/TrafficChart";
import FilteringRatioChart from "../charts/FilteringRatioChart";

const PROTOCOLS = ["all", "tcp", "udp", "icmp", "other"];
const DISPLAY_TYPES = ["pps", "bits"];

export default function DashboardSelects() {
  const { t } = useTranslation();
  const [storedZone, setZone] = usePersistedState("dashboard.zone", "all");
  const [storedService, setService] = usePersistedState(
    "dashboard.service",
    "all",
  );
  const [protocol, setProtocol] = usePersistedState(
    "dashboard.protocol",
    "all",
    PROTOCOLS,
  );
  const [type, setType] = usePersistedState(
    "dashboard.displayType",
    "pps",
    DISPLAY_TYPES,
  );
  const { data, isPending, isError, error } = useZones();

  // saqlangan zona o'chirilgan bo'lsa -> "all"
  const zone =
    storedZone === "all" || data?.some((z) => z.zoneName === storedZone)
      ? storedZone
      : "all";

  // saqlangan servis shu zonada yo'q bo'lsa -> "all"
  const services = useServices(zone);
  const service =
    zone === "all"
      ? "all"
      : storedService === "all" ||
          storedService === SERVICE_NONE ||
          storedService === SERVICE_RESPONSE ||
          !services.data ||
          services.isPlaceholderData ||
          services.data.some((s) => s.serviceName === storedService)
        ? storedService
        : "all";

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
      <FilteringRatioChart zone={zone} service={service} />
    </>
  );
}
