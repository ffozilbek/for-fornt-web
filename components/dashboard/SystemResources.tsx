"use client";
import { useSystemResources } from "@/hooks/useDashboard";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Cpu, HardDrive, MemoryStick } from "lucide-react";
import { useTranslation } from "react-i18next";
import CustomSkeleton from "../shared/CustomSkeleton";

export default function SystemResources() {
  const { data, isPending, isError, error } = useSystemResources();
  const { t } = useTranslation();

  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => {
          return <CustomSkeleton key={i} />;
        })}
      </div>
    );
  }
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const { ram, cpu, disk } = data;
  const active = cpu.lcores.filter((c) => c.is_active).length;
  const gb = (mb: number) => (mb / 1024).toFixed(1);

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">
        {t("misc.resources")}
      </h2>
      <div className="grid grid-cols-3 gap-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <HardDrive size={18} />
              <span>DISK</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{gb(disk.used_mb)} GB</p>
            <div className="text-muted-foreground mb-2">
              <p>
                <span>{gb(disk.used_mb)}</span> /{" "}
                <span>{gb(disk.total_mb)} GB</span>
              </p>
            </div>
            <Progress value={disk.usage_pct} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <p>
              {t("misc.free")} {gb(disk.free_mb)} GB
            </p>
            <p>{disk.usage_pct.toFixed(2)} %</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <MemoryStick size={18} />
              <span>RAM</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{ram.used_mb} MB</p>
            <div className="text-muted-foreground mb-2">
              <p>
                <span>{ram.used_mb}</span> / <span>{ram.total_mb} MB</span>
              </p>
            </div>
            <Progress value={ram.usage_pct} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <p>
              {t("misc.free")} {ram.free_mb} MB
            </p>
            <p>{ram.usage_pct.toFixed(2)} %</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
              <Cpu size={18} />
              <span>CPU AVG</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {cpu.avg_pct == 0 ? cpu.avg_pct : cpu.avg_pct.toFixed(2)} %
            </p>
            <div className="text-muted-foreground mb-2">
              <p>{t("misc.averageLcoreUtilization")}</p>
            </div>
            <Progress value={cpu.avg_pct} />
          </CardContent>
          <CardFooter className="flex justify-between">
            <p>
              {t("misc.free")} {active}
            </p>
            <p>{cpu.avg_pct == 0 ? cpu.avg_pct : cpu.avg_pct.toFixed(2)} %</p>
          </CardFooter>
        </Card>
      </div>
    </section>
  );
}
