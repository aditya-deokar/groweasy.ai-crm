"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";
import { CorrectSkippedModal } from "./correct-skipped-modal";
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
  onReimportSkipped?: (rowIndex: number, newRawData: Record<string, string>) => void;
  isReimportingSkipped?: boolean;
}

export function SkippedRecordsTable({ records, onReimportSkipped, isReimportingSkipped = false }: SkippedRecordsTableProps) {
  const [correctingRow, setCorrectingRow] = useState<SkippedRecord | null>(null);

  return (
    <div className="flex flex-col space-y-4">
      <Card className="overflow-hidden border border-red-200 shadow-sm dark:border-red-900/50">
      <ScrollArea 
        className="h-[320px] w-full rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-inset"
        tabIndex={0}
        aria-label="Skipped records table"
      >
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
              <TableHead className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-red-900 dark:text-red-400 text-right">
                ACTIONS
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
                  <TableCell className="px-4 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCorrectingRow(row)}
                      aria-label={`Correct skipped record on row ${row.rowIndex}`}
                      className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/40 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none"
                    >
                      <Wrench className="mr-2 h-4 w-4" />
                      Correct
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No skipped records.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>

      <CorrectSkippedModal
        open={correctingRow !== null}
        onOpenChange={(open) => !open && setCorrectingRow(null)}
        rawData={correctingRow?.rawData ?? null}
        reason={correctingRow?.reason ?? null}
        onReimport={(newRawData) => {
          if (correctingRow && onReimportSkipped) {
            onReimportSkipped(correctingRow.rowIndex, newRawData);
            setCorrectingRow(null);
          }
        }}
        isReimporting={isReimportingSkipped}
      />
    </div>
  );
}
