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
import type { ImportedRecord } from "@/lib/imports/contracts";
import {
  formatCellValue,
  formatStatusLabel,
  getImportStatusTone,
} from "@/lib/imports/format";

interface ParsedRecordsTableProps {
  records: ImportedRecord[];
}

export function ParsedRecordsTable({ records }: ParsedRecordsTableProps) {
  const columns = useMemo<ColumnDef<ImportedRecord>[]>(
    () => [
      {
        header: "ROW",
        accessorKey: "rowIndex",
      },
      {
        header: "LEAD NAME",
        cell: ({ row }) => formatCellValue(row.original.record.name),
      },
      {
        header: "EMAIL",
        cell: ({ row }) => formatCellValue(row.original.record.email),
      },
      {
        header: "CONTACT",
        cell: ({ row }) => {
          const record = row.original.record;

          if (record.country_code && record.mobile_without_country_code) {
            return `${record.country_code}${record.mobile_without_country_code}`;
          }

          return "—";
        },
      },
      {
        header: "DATE CREATED",
        cell: ({ row }) => formatCellValue(row.original.record.created_at),
      },
      {
        header: "COMPANY",
        cell: ({ row }) => formatCellValue(row.original.record.company),
      },
      {
        header: "STATUS",
        cell: ({ row }) => {
          const status = row.original.record.crm_status;
          const label = formatStatusLabel(status ?? "UNKNOWN");
          const tone = getImportStatusTone(status ?? "");

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
        },
      },
      {
        header: "CRM NOTE",
        cell: ({ row }) => {
          const note = formatCellValue(row.original.record.crm_note);

          return (
            <div className="max-w-[280px] truncate" title={note}>
              {note}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: records,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="overflow-hidden border shadow-sm">
      <ScrollArea className="h-[420px] w-full rounded-md">
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
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No parsed records found.
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
