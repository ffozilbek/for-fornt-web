import { useServices } from "@/hooks/useDashboard";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useTranslation } from "react-i18next";
import { Service } from "@/types/dashboard";
import { SERVICE_NONE, SERVICE_RESPONSE } from "@/lib/constants";

const serviceLabel = (s: Service) =>
  s.ports === "any" ? s.protocol : `${s.protocol} ${s.ports}`;

type Props = { zone: string; value: string; onChange: (s: string) => void };

export default function SelectServices({ zone, value, onChange }: Props) {
  const { data, isFetching, isError, error } = useServices(zone);
  const { t } = useTranslation();

  if (isError)
    return (
      <Alert variant="destructive">
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );

  const items = [
    { label: t("misc.allServices"), value: "all" },
    ...(data ?? []).map((s) => ({
      label: serviceLabel(s),
      value: s.serviceName,
    })),
    { label: t("misc.noMatchingServiceACL"), value: SERVICE_NONE },
    { label: t("misc.responseTraffic"), value: SERVICE_RESPONSE },
  ];

  return (
    <Select
      items={items}
      value={value}
      disabled={zone === "all" || isFetching}
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
