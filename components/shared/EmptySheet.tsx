import { Sheet } from "lucide-react";

export default function EmptySheet() {
  return (
    <div className="flex flex-col gap-2 items-center text-muted-foreground">
      <Sheet strokeWidth={1.25} />
      <span>Jadval hali bosh</span>
    </div>
  );
}
