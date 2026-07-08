"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ImportBatch } from "@/lib/imports/contracts";
import { formatStatusLabel, getImportStatusTone } from "@/lib/imports/format";

interface BatchesTableProps {
  batches: ImportBatch[];
}

export function BatchesTable({ batches }: BatchesTableProps) {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <ScrollArea className="h-[280px] w-full rounded-md">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            <TableRow>
              <TableHead className="px-4 py-3">BATCH</TableHead>
              <TableHead className="px-4 py-3">STATUS</TableHead>
              <TableHead className="px-4 py-3">ROWS</TableHead>
              <TableHead className="px-4 py-3">RETRIES</TableHead>
              <TableHead className="px-4 py-3">ERROR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No batch details are available yet.
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="px-4 py-2 font-medium text-foreground">
                    #{batch.batchIndex + 1}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <BatchStatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">
                    {batch.rowStartIndex} - {batch.rowEndIndex} ({batch.rowCount})
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">
                    {batch.retryCount}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-muted-foreground">
                    <div className="max-w-[320px] truncate" title={batch.errorMessage ?? "—"}>
                      {batch.errorMessage ?? "—"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}

function BatchStatusBadge({ status }: { status: string }) {
  const tone = getImportStatusTone(status);
  const label = formatStatusLabel(status);

  if (tone === "success") {
    return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">{label}</Badge>;
  }

  if (tone === "danger") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">{label}</Badge>;
  }

  if (tone === "warning") {
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{label}</Badge>;
  }

  return <Badge variant="outline">{label}</Badge>;
}
