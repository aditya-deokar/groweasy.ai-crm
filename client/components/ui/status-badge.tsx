"use client";

import { Badge } from "@/components/ui/badge";

export type StatusTone = "success" | "danger" | "warning" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

const toneStyles: Record<StatusTone, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800",
  danger:
    "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800",
  neutral:
    "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-700",
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={toneStyles[tone]}>
      {label}
    </Badge>
  );
}
