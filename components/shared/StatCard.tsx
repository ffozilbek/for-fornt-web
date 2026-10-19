import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function StatCard({
  hour,
  icon,
  value,
  label,
  hint,
}: {
  hour?: string;
  icon: ReactNode;
  value: ReactNode;
  label: string;
  hint?: ReactNode;
}) {
  return (
    <Card className="h-full cursor-pointer transition-colors hover:bg-accent/40">
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground flex items-center justify-between">
          <div className="bg-sidebar-accent-foreground text-sidebar-accent h-8 w-8 rounded-md flex items-center justify-center relative">
            {icon}
          </div>
          <span>{hour}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}
