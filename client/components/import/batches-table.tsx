"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ImportBatch } from "@/lib/imports/contracts"
import { formatStatusLabel, getImportStatusTone } from "@/lib/imports/format"

interface BatchesTableProps {
  batches: ImportBatch[]
}

export function BatchesTable({ batches }: BatchesTableProps) {
  return (
    <Card className="overflow-hidden border shadow-sm">
      <ScrollArea className="h-[240px] w-full rounded-md">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
            <TableRow>
              <TableHead className="px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Batch
              </TableHead>
              <TableHead className="px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Status
              </TableHead>
              <TableHead className="px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Rows
              </TableHead>
              <TableHead className="px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Retries
              </TableHead>
              <TableHead className="px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Safety
              </TableHead>
              <TableHead className="px-4 py-2.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Error
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-20 text-center text-sm text-muted-foreground"
                >
                  No batch details available yet.
                </TableCell>
              </TableRow>
            ) : (
              batches.map((batch) => (
                <TableRow
                  key={batch.id}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell className="px-4 py-2 text-sm font-medium text-foreground">
                    #{batch.batchIndex + 1}
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <StatusBadge
                      label={formatStatusLabel(batch.status)}
                      tone={getImportStatusTone(batch.status)}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                    {batch.rowStartIndex}–{batch.rowEndIndex} ({batch.rowCount})
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                    {batch.retryCount}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                    {batch.safetyEventCount > 0 ? (
                      <span
                        title={`${batch.blockedRows} blocked, ${batch.warnedRows} warned`}
                      >
                        {batch.safetyEventCount}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                    <div
                      className="max-w-[280px] truncate"
                      title={batch.errorMessage ?? "—"}
                    >
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
  )
}
