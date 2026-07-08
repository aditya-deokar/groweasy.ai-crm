"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2 } from "lucide-react";
import type { GrowEasyCrmRecord } from "@/lib/imports/contracts";

interface EditRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: GrowEasyCrmRecord | null;
  onSave: (record: Partial<GrowEasyCrmRecord>) => void;
  isSaving: boolean;
}

const FIELD_GROUPS: { label: string; fields: { key: keyof GrowEasyCrmRecord; label: string; type?: "textarea" }[] }[] = [
  {
    label: "Contact Information",
    fields: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "country_code", label: "Country Code" },
      { key: "mobile_without_country_code", label: "Mobile" },
    ],
  },
  {
    label: "Location & Company",
    fields: [
      { key: "company", label: "Company" },
      { key: "city", label: "City" },
      { key: "state", label: "State" },
      { key: "country", label: "Country" },
    ],
  },
  {
    label: "CRM Details",
    fields: [
      { key: "lead_owner", label: "Lead Owner" },
      { key: "crm_status", label: "Status" },
      { key: "data_source", label: "Data Source" },
      { key: "possession_time", label: "Possession Time" },
    ],
  },
  {
    label: "Notes",
    fields: [
      { key: "crm_note", label: "Note", type: "textarea" },
      { key: "description", label: "Description", type: "textarea" },
    ],
  },
];

export function EditRecordModal({ open, onOpenChange, record, onSave, isSaving }: EditRecordModalProps) {
  const [formData, setFormData] = useState<Partial<GrowEasyCrmRecord>>(() =>
    record ? { ...record } : {}
  );

  const handleChange = (key: keyof GrowEasyCrmRecord, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-4 w-4 text-[#0D652D]" />
            Edit Imported Record
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-1 space-y-5 py-3">
            {FIELD_GROUPS.map((group) => (
              <div key={group.label} className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h4>
                {group.fields.some((f) => f.type === "textarea") ? (
                  // Textarea fields render full-width
                  <div className="space-y-3">
                    {group.fields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <label htmlFor={`edit-${field.key}`} className="text-xs font-medium text-muted-foreground">
                          {field.label}
                        </label>
                        <textarea
                          id={`edit-${field.key}`}
                          value={(formData[field.key] as string) || ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="flex min-h-[64px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {group.fields.map((field) => (
                      <div key={field.key} className="space-y-1.5">
                        <label htmlFor={`edit-${field.key}`} className="text-xs font-medium text-muted-foreground">
                          {field.label}
                        </label>
                        <Input
                          id={`edit-${field.key}`}
                          value={(formData[field.key] as string) || ""}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <DialogFooter className="mt-3 pt-3 border-t">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving} className="bg-[#0D652D] text-white hover:bg-[#0A4D22]">
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
