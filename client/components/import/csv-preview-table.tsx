"use client";

import { useMemo } from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
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
        cell: ({ row }) => formatCellValue(row.original.skipReason),
      },
      ...columns.map<ColumnDef<PreviewRow>>((columnName) => ({
        header: columnName.toUpperCase(),
        id: columnName,
        cell: ({ row }) => formatCellValue(row.original.values[columnName]),
      })),
    ],
    [columns]
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="overflow-hidden border bg-card text-card-foreground shadow-sm">
      <ScrollArea className="h-[600px] w-full rounded-md">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold text-foreground"
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-2 text-sm text-muted-foreground"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No preview rows are available.
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

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "danger" | "warning" | "neutral";
}) {
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
