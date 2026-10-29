// grafik tooltip qatori: rang belgisi, nom va formatlangan qiymat
export default function TooltipRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-1 items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-xs" style={{ backgroundColor: color }} />
        <span className="text-muted-foreground">{label}</span>
      </div>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}
