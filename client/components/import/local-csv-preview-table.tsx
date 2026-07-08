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

interface LocalCsvRow {
  _rowIndex: number;
  [key: string]: string | number;
}

interface LocalCsvPreviewTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

export function LocalCsvPreviewTable({ headers, rows }: LocalCsvPreviewTableProps) {
  const tableData = useMemo<LocalCsvRow[]>(
    () =>
      rows.map((row, index) => ({
        _rowIndex: index + 1,
        ...row,
      })),
    [rows]
  );

  const columns = useMemo<ColumnDef<LocalCsvRow>[]>(
    () => [
      {
        header: "#",
        accessorKey: "_rowIndex",
        size: 60,
      },
      ...headers.map<ColumnDef<LocalCsvRow>>((header) => ({
        header: header.toUpperCase(),
        id: header,
        accessorFn: (row) => row[header] ?? "",
        cell: ({ getValue }) => {
          const value = getValue() as string;
          return value.trim().length > 0 ? value : "—";
        },
        size: 160,
      })),
    ],
    [headers]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Card className="overflow-hidden border bg-card text-card-foreground shadow-sm">
      <ScrollArea className="h-[500px] w-full rounded-md">
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
                  No rows to display.
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
