"use client";
import { useTranslation } from "react-i18next";
import { useZones } from "@/hooks/useDashboard";
import CustomSkeleton from "../shared/CustomSkeleton";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";

export default function SelectZones(z(zone,setZone): {}) {
  const { t } = useTranslation();
  const { data, isPending, isError, error } = useZones();
  

  if (isPending) {
    return <CustomSkeleton />;
  }
  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const items = [
    { label: t("navigation.allZones"), value: "all" },
    ...data.map((z) => ({ label: z.zoneName, value: z.zoneName })),
  ];

  return (
    <Select
      items={items}
      value={zone}
      onValueChange={(v) => v !== null && setZone(v)}
    >
      <SelectTrigger className="w-full max-w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
