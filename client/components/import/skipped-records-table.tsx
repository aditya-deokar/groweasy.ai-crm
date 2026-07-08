"use client";

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
import type { SkippedRecord } from "@/lib/imports/contracts";

interface SkippedRecordsTableProps {
  records: SkippedRecord[];
}

export function SkippedRecordsTable({ records }: SkippedRecordsTableProps) {
  return (
    <Card className="overflow-hidden border border-red-200 shadow-sm dark:border-red-900/50">
      <ScrollArea className="h-[320px] w-full rounded-md">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-red-50 dark:bg-red-950/50">
            <TableRow>
              <TableHead className="w-[100px] whitespace-nowrap px-4 py-3 text-xs font-semibold text-red-900 dark:text-red-400">
                ROW NUMBER
              </TableHead>
              <TableHead className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-red-900 dark:text-red-400">
                REASON
              </TableHead>
              <TableHead className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-red-900 dark:text-red-400">
                ORIGINAL DATA (JSON)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length > 0 ? (
              records.map((row) => (
                <TableRow key={`${row.rowIndex}-${row.reason}`} className="hover:bg-red-50/50 dark:hover:bg-red-900/20">
                  <TableCell className="whitespace-nowrap px-4 py-2 text-sm font-medium text-foreground">
                    {row.rowIndex}
                  </TableCell>
                  <TableCell className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                    {row.reason}
                  </TableCell>
                  <TableCell className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    <div className="max-w-md truncate" title={JSON.stringify(row.rawData)}>
                      {JSON.stringify(row.rawData)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No skipped records.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
}
