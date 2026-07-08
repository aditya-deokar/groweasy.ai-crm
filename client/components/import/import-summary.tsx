"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  type LucideIcon,
} from "lucide-react";

export interface ImportSummaryCard {
  id: string;
  label: string;
  value: number | string;
  tone?: "neutral" | "success" | "danger" | "warning";
}

interface ImportSummaryProps {
  cards: ImportSummaryCard[];
}

export function ImportSummary({ cards }: ImportSummaryProps) {
  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = getCardIcon(index, card.tone);
        const palette = getCardPalette(card.tone);

        return (
          <div
            key={card.id}
            className={`flex items-center gap-3 rounded-xl border p-3.5 transition-colors ${palette.bg}`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${palette.iconBg} ${palette.iconText}`}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
                {card.label}
              </p>
              <p className={`text-xl font-bold leading-tight ${palette.valueText}`}>
                {card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getCardIcon(index: number, tone: ImportSummaryCard["tone"]): LucideIcon {
  if (tone === "success") return CheckCircle2;
  if (tone === "danger") return AlertTriangle;
  if (tone === "warning") return Gauge;
  return index === 0 ? FileSpreadsheet : Gauge;
}

function getCardPalette(tone: ImportSummaryCard["tone"]) {
  switch (tone) {
    case "success":
      return {
        bg: "bg-emerald-50/50 border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-800/40",
        iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
        iconText: "text-emerald-600 dark:text-emerald-400",
        valueText: "text-emerald-700 dark:text-emerald-400",
      };
    case "danger":
      return {
        bg: "bg-rose-50/50 border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-800/40",
        iconBg: "bg-rose-100 dark:bg-rose-900/40",
        iconText: "text-rose-600 dark:text-rose-400",
        valueText: "text-rose-700 dark:text-rose-400",
      };
    case "warning":
      return {
        bg: "bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-800/40",
        iconBg: "bg-amber-100 dark:bg-amber-900/40",
        iconText: "text-amber-600 dark:text-amber-400",
        valueText: "text-amber-700 dark:text-amber-400",
      };
    default:
      return {
        bg: "bg-slate-50/50 border-slate-200/60 dark:bg-slate-900/20 dark:border-slate-700/40",
        iconBg: "bg-slate-100 dark:bg-slate-800/40",
        iconText: "text-slate-600 dark:text-slate-400",
        valueText: "text-foreground",
      };
  }
}
