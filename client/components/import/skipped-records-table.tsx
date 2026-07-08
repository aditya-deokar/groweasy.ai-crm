"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, AlertCircle } from "lucide-react";
import { CorrectSkippedModal } from "./correct-skipped-modal";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

/** Show key identifiers from raw data instead of full JSON blob */
function getRecordSummary(rawData: Record<string, string>): string {
  const parts: string[] = [];
  const name = rawData.name || rawData.Name || rawData.NAME;
  const email = rawData.email || rawData.Email || rawData.EMAIL;
  const mobile = rawData.mobile_without_country_code || rawData.phone || rawData.Phone;

  if (name) parts.push(name);
  if (email) parts.push(email);
  if (mobile) parts.push(mobile);

  if (parts.length === 0) {
    // Fall back to first 2 non-empty values
    const values = Object.values(rawData).filter((v) => v && v.trim().length > 0);
    return values.slice(0, 2).join(" · ") || "No data";
  }

  return parts.join(" · ");
}

export function SkippedRecordsTable({ records, onReimportSkipped, isReimportingSkipped = false }: SkippedRecordsTableProps) {
  const [correctingRow, setCorrectingRow] = useState<SkippedRecord | null>(null);

  return (
    <div className="flex flex-col space-y-4">
      <Card className="overflow-hidden border border-rose-200/70 shadow-sm dark:border-rose-900/40">
        <ScrollArea
          className="h-[320px] w-full rounded-md"
          tabIndex={0}
          aria-label="Skipped records table"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-rose-50/80 dark:bg-rose-950/40 backdrop-blur-sm">
              <TableRow>
                <TableHead className="w-[70px] whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Row
                </TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Skip Reason
                </TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Record Preview
                </TableHead>
                <TableHead className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length > 0 ? (
                records.map((row) => (
                  <TableRow key={`${row.rowIndex}-${row.reason}`} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors">
                    <TableCell className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-foreground">
                      #{row.rowIndex}
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                        <span className="text-sm text-rose-600 dark:text-rose-400">{row.reason}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2.5">
                      <span className="text-sm text-muted-foreground max-w-[300px] truncate block" title={JSON.stringify(row.rawData)}>
                        {getRecordSummary(row.rawData)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCorrectingRow(row)}
                        aria-label={`Fix and re-import record on row ${row.rowIndex}`}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/30 gap-1.5"
                      >
                        <Wrench className="h-3.5 w-3.5" />
                        Fix & Re-import
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-sm text-muted-foreground">
                    No skipped records — all leads imported successfully!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      <CorrectSkippedModal
        key={correctingRow?.rowIndex ?? "correct-skipped-empty"}
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
