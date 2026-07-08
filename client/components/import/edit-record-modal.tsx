"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { GrowEasyCrmRecord } from "@/lib/imports/contracts";

interface EditRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: GrowEasyCrmRecord | null;
  onSave: (record: Partial<GrowEasyCrmRecord>) => void;
  isSaving: boolean;
}

export function EditRecordModal({ open, onOpenChange, record, onSave, isSaving }: EditRecordModalProps) {
  const [formData, setFormData] = useState<Partial<GrowEasyCrmRecord>>({});

  useEffect(() => {
    if (open && record) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(record);
    }
  }, [open, record]);

  const handleChange = (key: keyof GrowEasyCrmRecord, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const fields: { key: keyof GrowEasyCrmRecord; label: string; type?: "textarea" }[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "country_code", label: "Country Code" },
    { key: "mobile_without_country_code", label: "Mobile" },
    { key: "company", label: "Company" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "country", label: "Country" },
    { key: "lead_owner", label: "Lead Owner" },
    { key: "crm_status", label: "Status" },
    { key: "data_source", label: "Data Source" },
    { key: "possession_time", label: "Possession Time" },
    { key: "crm_note", label: "Note", type: "textarea" },
    { key: "description", label: "Description", type: "textarea" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Record</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.filter(f => f.type !== "textarea").map((field) => (
                <div key={field.key} className="space-y-2">
                  <label htmlFor={field.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {field.label}
                  </label>
                  <Input
                    id={field.key}
                    value={(formData[field.key] as string) || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {fields.filter(f => f.type === "textarea").map((field) => (
              <div key={field.key} className="space-y-2 mt-4">
                <label htmlFor={field.key} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {field.label}
                </label>
                <textarea
                  id={field.key}
                  value={(formData[field.key] as string) || ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            ))}
          </div>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
