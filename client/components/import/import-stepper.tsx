"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportStep = "upload" | "review" | "processing" | "results";

const STEPS: { id: ImportStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "review", label: "Review" },
  { id: "processing", label: "Processing" },
  { id: "results", label: "Results" },
];

interface ImportStepperProps {
  currentStep: ImportStep;
}

function getStepIndex(step: ImportStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

export function ImportStepper({ currentStep }: ImportStepperProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <nav aria-label="Import progress" className="w-full">
      <ol className="flex items-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <li
              key={step.id}
              className={cn("flex items-center", index < STEPS.length - 1 && "flex-1")}
            >
              {/* Step circle + label */}
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                    isCompleted &&
                      "bg-[#0D652D] text-white shadow-sm",
                    isCurrent &&
                      "bg-[#0D652D] text-white shadow-md ring-4 ring-[#0D652D]/20",
                    isPending &&
                      "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-sm font-medium sm:block whitespace-nowrap transition-colors duration-200",
                    isCompleted && "text-[#0D652D] dark:text-emerald-400",
                    isCurrent && "text-foreground",
                    isPending && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="mx-3 h-[2px] flex-1 rounded-full overflow-hidden bg-border">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-out",
                      isCompleted ? "w-full bg-[#0D652D]" : "w-0 bg-transparent"
                    )}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
