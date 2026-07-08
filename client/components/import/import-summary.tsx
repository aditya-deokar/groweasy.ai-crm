"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = getCardIcon(index, card.tone);
        const palette = getCardPalette(card.tone);

        return (
          <Card key={card.id}>
            <CardContent className="flex items-center space-x-4 pt-6">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${palette.iconBg} ${palette.iconText}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.label}</p>
                <h4 className="text-2xl font-bold">{card.value}</h4>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function getCardIcon(index: number, tone: ImportSummaryCard["tone"]): LucideIcon {
  if (tone === "success") {
    return CheckCircle2;
  }

  if (tone === "danger") {
    return AlertTriangle;
  }

  if (tone === "warning") {
    return Gauge;
  }

  return index === 0 ? FileSpreadsheet : Gauge;
}

function getCardPalette(tone: ImportSummaryCard["tone"]) {
  switch (tone) {
    case "success":
      return {
        iconBg: "bg-green-100 dark:bg-green-900/30",
        iconText: "text-green-600 dark:text-green-400",
      };
    case "danger":
      return {
        iconBg: "bg-red-100 dark:bg-red-900/30",
        iconText: "text-red-600 dark:text-red-400",
      };
    case "warning":
      return {
        iconBg: "bg-amber-100 dark:bg-amber-900/30",
        iconText: "text-amber-600 dark:text-amber-400",
      };
    default:
      return {
        iconBg: "bg-blue-100 dark:bg-blue-900/30",
        iconText: "text-blue-600 dark:text-blue-400",
      };
  }
}
