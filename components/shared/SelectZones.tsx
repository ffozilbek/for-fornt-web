"use client";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Zone } from "@/types/dashboard";

type Props = { zones: Zone[]; value: string; onChange: (zone: string) => void };

export default function SelectZones({ zones, value, onChange }: Props) {
  const { t } = useTranslation();

  const items = [
    { label: t("navigation.allZones"), value: "all" },
    ...zones.map((z) => ({ label: z.zoneName, value: z.zoneName })),
  ];

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(v) => v !== null && onChange(v)}
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
