"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Wrench } from "lucide-react";

interface CorrectSkippedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawData: Record<string, string> | null;
  reason: string | null;
  onReimport: (newRawData: Record<string, string>) => void;
  isReimporting: boolean;
}

/** Known field groups for logical organization */
const FIELD_GROUPS: { label: string; fields: string[] }[] = [
  { label: "Contact Information", fields: ["name", "email", "country_code", "mobile_without_country_code", "phone"] },
  { label: "Location", fields: ["company", "city", "state", "country"] },
  { label: "CRM Fields", fields: ["lead_owner", "crm_status", "crm_note", "data_source", "created_at"] },
];

function categorizeFields(rawData: Record<string, string>) {
  const categorized: { label: string; entries: [string, string][] }[] = [];
  const usedKeys = new Set<string>();

  for (const group of FIELD_GROUPS) {
    const entries: [string, string][] = [];
    for (const field of group.fields) {
      const key = Object.keys(rawData).find((k) => k.toLowerCase() === field.toLowerCase());
      if (key) {
        entries.push([key, rawData[key]]);
        usedKeys.add(key);
      }
    }
    if (entries.length > 0) {
      categorized.push({ label: group.label, entries });
    }
  }

  // Any remaining fields that didn't match a known group
  const otherEntries = Object.entries(rawData).filter(([key]) => !usedKeys.has(key));
  if (otherEntries.length > 0) {
    categorized.push({ label: "Other Fields", entries: otherEntries });
  }

  return categorized;
}

/** Try to identify the problematic field from the reason string */
function getProblematicFields(reason: string | null): Set<string> {
  if (!reason) return new Set();
  const lower = reason.toLowerCase();
  const fields = new Set<string>();

  if (lower.includes("email")) fields.add("email");
  if (lower.includes("mobile") || lower.includes("phone")) fields.add("mobile_without_country_code");
  if (lower.includes("name")) fields.add("name");
  if (lower.includes("contact")) {
    fields.add("email");
    fields.add("mobile_without_country_code");
  }

  return fields;
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CorrectSkippedModal({ open, onOpenChange, rawData, reason, onReimport, isReimporting }: CorrectSkippedModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>(() =>
    rawData ? { ...rawData } : {}
  );

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReimport(formData);
  };

  const problematicFields = getProblematicFields(reason);
  const groups = categorizeFields(formData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-4.5 w-4.5 text-rose-600" />
            Fix Skipped Record
          </DialogTitle>
          {reason && (
            <DialogDescription className="flex items-start gap-2 mt-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="text-sm">{reason}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 space-y-5 py-3">
            {groups.map((group) => (
              <div key={group.label} className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {group.entries.map(([key]) => {
                    const isProblematic = problematicFields.has(key.toLowerCase());
                    return (
                      <div key={key} className="space-y-1.5">
                        <label
                          htmlFor={`correct-${key}`}
                          className={`text-xs font-medium block truncate ${
                            isProblematic
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-muted-foreground"
                          }`}
                          title={key}
                        >
                          {formatFieldLabel(key)}
                          {isProblematic && " ⚠"}
                        </label>
                        <Input
                          id={`correct-${key}`}
                          value={formData[key] ?? ""}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className={
                            isProblematic
                              ? "border-rose-300 focus-visible:ring-rose-500 bg-rose-50/50 dark:border-rose-700 dark:bg-rose-950/20"
                              : ""
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-3 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isReimporting} className="bg-[#0D652D] text-white hover:bg-[#0A4D22] gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              {isReimporting ? "Re-importing..." : "Fix & Re-import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
