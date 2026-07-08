"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import type { ImportEvent } from "@/lib/imports/contracts";
import { formatRelativeTime } from "@/lib/utils/format";

interface ImportActivityProps {
  events: ImportEvent[];
}

function formatEventType(eventType: string): string {
  return eventType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ImportActivity({ events }: ImportActivityProps) {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          No activity events yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="max-h-[240px] overflow-y-auto">
          {events.map((event, index) => (
            <div
              key={`${event.createdAt}-${event.eventType}-${index}`}
              className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/20 transition-colors"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted">
                <Activity className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{event.message}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {formatEventType(event.eventType)}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60">·</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
