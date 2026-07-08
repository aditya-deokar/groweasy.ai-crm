"use client";

import { useMemo } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { PreviewRow } from "@/lib/imports/contracts";
import {
  formatCellValue,
  formatStatusLabel,
  getImportStatusTone,
} from "@/lib/imports/format";

interface CsvPreviewTableProps {
  rows: PreviewRow[];
  columns: string[];
}

export function CsvPreviewTable({ rows, columns }: CsvPreviewTableProps) {
  const tableColumns = useMemo<ColumnDef<PreviewRow>[]>(
    () => [
      {
        header: "ROW",
        accessorKey: "rowIndex",
        size: 60,
      },
      {
        header: "STATUS",
        accessorKey: "validationStatus",
        cell: ({ row }) => {
          const value = row.original.validationStatus;
          const tone = getImportStatusTone(value);
          return <StatusBadge label={formatStatusLabel(value)} tone={tone} />;
        },
      },
      {
        header: "SKIP REASON",
        accessorKey: "skipReason",
        cell: ({ row }) => {
          const reason = row.original.skipReason;
          if (!reason) return <span className="text-muted-foreground">—</span>;
          return <span className="text-rose-600 dark:text-rose-400 text-xs">{reason}</span>;
        },
      },
      ...columns.map<ColumnDef<PreviewRow>>((columnName) => ({
        header: columnName.toUpperCase(),
        id: columnName,
        cell: ({ row }) => formatCellValue(row.original.values[columnName]),
      })),
    ],
    [columns]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="overflow-hidden border shadow-sm">
      <ScrollArea className="h-[400px] w-full rounded-md">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                const isSkipped = row.original.validationStatus === "SKIPPED";
                return (
                  <TableRow
                    key={row.id}
                    className={`hover:bg-muted/30 transition-colors ${
                      isSkipped ? "bg-rose-50/30 dark:bg-rose-950/10" : ""
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-2 text-sm text-muted-foreground"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No preview rows available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
