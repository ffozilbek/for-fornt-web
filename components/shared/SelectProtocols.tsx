import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useTranslation } from "react-i18next";

type Props = { value: string; onChange: (s: string) => void };

export default function SelectProtocols({ value, onChange }: Props) {
  const { t } = useTranslation();

  const items = [
    { label: t("misc.allProtocols"), value: "all" },
    { label: "TCP", value: "tcp" },
    { label: "UDP", value: "udp" },
    { label: "ICMP", value: "icmp" },
    { label: t("misc.other"), value: "other" },
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
