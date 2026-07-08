"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ImportEvent } from "@/lib/imports/contracts";

interface ImportActivityProps {
  events: ImportEvent[];
}

export function ImportActivity({ events }: ImportActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import activity</CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No import events have been published yet.
          </p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={`${event.createdAt}-${event.eventType}`} className="rounded-lg border p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-foreground">{event.message}</p>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {event.eventType}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatEventTimestamp(event.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatEventTimestamp(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
