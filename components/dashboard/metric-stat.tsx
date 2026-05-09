import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
}

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-destructive/10 text-destructive",
  neutral: "bg-muted text-muted-foreground",
};

export function MetricStat({ label, value, delta, deltaLabel, hint, icon: Icon, tone = "neutral" }: Props) {
  const hasDelta = typeof delta === "number";
  const positive = hasDelta && delta! >= 0;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn("rounded-xl p-2", toneClasses[tone])}>
          <Icon size={18} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
      {hasDelta && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
              positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {positive ? "+" : ""}
            {Math.round((delta ?? 0) * 100)}%
          </span>
          {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
        </div>
      )}
      {!hasDelta && hint && (
        <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
      )}
    </Card>
  );
}
