"use client";

import { useEffect, useState } from "react";
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

interface CorrectSkippedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawData: Record<string, string> | null;
  reason: string | null;
  onReimport: (newRawData: Record<string, string>) => void;
  isReimporting: boolean;
}

export function CorrectSkippedModal({ open, onOpenChange, rawData, reason, onReimport, isReimporting }: CorrectSkippedModalProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && rawData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(rawData);
    }
  }, [open, rawData]);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReimport(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Correct Skipped Record</DialogTitle>
          <DialogDescription className="text-red-500 font-medium mt-2">
            Reason skipped: {reason}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <label htmlFor={key} className="text-xs uppercase text-muted-foreground truncate font-medium block mb-1" title={key}>
                    {key}
                  </label>
                  <Input 
                    id={key}
                    value={value} 
                    onChange={(e) => handleChange(key, e.target.value)} 
                  />
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isReimporting}>
              {isReimporting ? "Re-importing..." : "Correct & Re-import"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
