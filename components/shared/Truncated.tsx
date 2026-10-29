import type { ReactNode } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// birinchi N ta element + qolganlari "+N" popover ichida
export default function Truncated({
  items,
  max,
}: {
  items: ReactNode[];
  max: number;
}) {
  if (items.length === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {items.slice(0, max)}
      {items.length > max && (
        <Popover>
          <PopoverTrigger
            openOnHover
            render={<Button variant="ghost" size="xs" />}
          >
            +{items.length - max}
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-80">
            <div className="flex flex-wrap gap-1">{items}</div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
