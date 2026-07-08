"use client";

import { useMemo, useState } from "react";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { EditRecordModal } from "./edit-record-modal";
import { ChevronDown, Columns3, Search, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import type { ImportedRecord } from "@/lib/imports/contracts";
import {
  formatCellValue,
  formatStatusLabel,
  getImportStatusTone,
} from "@/lib/imports/format";

const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

/** Columns hidden by default — less important for quick review */
const DEFAULT_HIDDEN: Record<string, boolean> = {
  country_code: false,
  possession_time: false,
  description: false,
  data_source: false,
  lead_owner: false,
};

interface ParsedRecordsTableProps {
  records: ImportedRecord[];
  onEditRecord?: (rowIndex: number, record: Partial<import("@/lib/imports/contracts").GrowEasyCrmRecord>) => void;
  isUpdatingRecord?: boolean;
}

export function ParsedRecordsTable({ records, onEditRecord, isUpdatingRecord = false }: ParsedRecordsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_HIDDEN);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [editingRow, setEditingRow] = useState<ImportedRecord | null>(null);

  const columns = useMemo<ColumnDef<ImportedRecord>[]>(
    () => [
      {
        header: "ROW",
        accessorKey: "rowIndex",
        enableHiding: false,
        size: 60,
      },
      {
        id: "name",
        header: "NAME",
        accessorFn: (row) => row.record.name ?? "",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val ? <span className="font-medium text-foreground">{val}</span> : <span className="text-muted-foreground">—</span>;
        },
      },
      {
        id: "email",
        header: "EMAIL",
        accessorFn: (row) => row.record.email ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "country_code",
        header: "CODE",
        accessorFn: (row) => row.record.country_code ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "mobile",
        header: "MOBILE",
        accessorFn: (row) => row.record.mobile_without_country_code ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "created_at",
        header: "DATE",
        accessorFn: (row) => row.record.created_at ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "company",
        header: "COMPANY",
        accessorFn: (row) => row.record.company ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "city",
        header: "CITY",
        accessorFn: (row) => row.record.city ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "state",
        header: "STATE",
        accessorFn: (row) => row.record.state ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "country",
        header: "COUNTRY",
        accessorFn: (row) => row.record.country ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "lead_owner",
        header: "LEAD OWNER",
        accessorFn: (row) => row.record.lead_owner ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "crm_status",
        header: "STATUS",
        accessorFn: (row) => row.record.crm_status ?? "",
        cell: ({ getValue }) => {
          const status = getValue() as string;
          if (!status) return <span className="text-muted-foreground">—</span>;
          return <StatusBadge label={formatStatusLabel(status)} tone={getImportStatusTone(status)} />;
        },
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue) return true;
          return row.original.record.crm_status === filterValue;
        },
      },
      {
        id: "crm_note",
        header: "NOTE",
        accessorFn: (row) => row.record.crm_note ?? "",
        cell: ({ getValue }) => {
          const note = formatCellValue(getValue() as string);
          return (
            <div className="max-w-[200px] truncate" title={note}>
              {note}
            </div>
          );
        },
      },
      {
        id: "data_source",
        header: "SOURCE",
        accessorFn: (row) => row.record.data_source ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "possession_time",
        header: "POSSESSION",
        accessorFn: (row) => row.record.possession_time ?? "",
        cell: ({ getValue }) => formatCellValue(getValue() as string),
      },
      {
        id: "description",
        header: "DESCRIPTION",
        accessorFn: (row) => row.record.description ?? "",
        cell: ({ getValue }) => {
          const desc = formatCellValue(getValue() as string);
          return (
            <div className="max-w-[200px] truncate" title={desc}>
              {desc}
            </div>
          );
        },
      },
      {
        id: "confidence",
        header: "AI SCORE",
        accessorFn: (row) => row.record.confidence,
        cell: ({ getValue }) => {
          const confidence = getValue() as Record<string, number> | null;
          if (!confidence || Object.keys(confidence).length === 0) return <span className="text-muted-foreground">—</span>;

          const scores = Object.values(confidence);
          const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
          const percentage = Math.round(avg * 100);

          let tone: "success" | "warning" | "danger" | "neutral" = "neutral";
          if (percentage >= 90) tone = "success";
          else if (percentage >= 70) tone = "warning";
          else tone = "danger";

          return (
            <div title={Object.entries(confidence).map(([k, v]) => `${k}: ${Math.round(v * 100)}%`).join('\n')}>
              <StatusBadge label={`${percentage}%`} tone={tone} />
            </div>
          );
        },
      },
      {
        id: "actions",
        header: "",
        size: 40,
        cell: ({ row }) => {
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingRow(row.original)}
              title="Edit Record"
              aria-label={`Edit record for ${row.original.record.name || 'unknown'}`}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          );
        },
      },
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: records,
    columns,
    state: {
      globalFilter,
      columnFilters,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = (filterValue as string).toLowerCase();
      const record = row.original.record;
      return Object.values(record).some(
        (val) => val && String(val).toLowerCase().includes(search)
      );
    },
  });

  function handleStatusFilterChange(value: string | null) {
    setStatusFilter(value);
    if (value) {
      setColumnFilters([{ id: "crm_status", value }]);
    } else {
      setColumnFilters([]);
    }
  }

  return (
    <div className="space-y-3">
      {/* Search, Filter, Column Toggle bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search records..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {/* CRM Status Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {statusFilter ? formatStatusLabel(statusFilter) : "All Statuses"}
                <ChevronDown className="ml-1.5 h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel className="text-xs">Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === null}
                onCheckedChange={() => handleStatusFilterChange(null)}
              >
                All Statuses
              </DropdownMenuCheckboxItem>
              {CRM_STATUS_VALUES.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() =>
                    handleStatusFilterChange(statusFilter === status ? null : status)
                  }
                >
                  {formatStatusLabel(status)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column Visibility Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Columns3 className="mr-1.5 h-3 w-3" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[400px] overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Toggle Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {typeof column.columnDef.header === "string"
                      ? column.columnDef.header
                      : column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border shadow-sm">
        <ScrollArea
          className="h-[380px] w-full rounded-md"
          tabIndex={0}
          aria-label="Imported records table"
        >
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
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/30 transition-colors">
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
                    className="h-20 text-center text-sm text-muted-foreground"
                  >
                    {globalFilter || statusFilter
                      ? "No records match your search or filter."
                      : "No imported records found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Footer info */}
      <div className="text-xs text-muted-foreground">
        Showing {table.getRowModel().rows.length} of {records.length} records
        {table.getAllColumns().filter((c) => c.getCanHide() && !c.getIsVisible()).length > 0 && (
          <> · {table.getAllColumns().filter((c) => c.getCanHide() && !c.getIsVisible()).length} columns hidden</>
        )}
      </div>

      <EditRecordModal
        key={editingRow?.rowIndex ?? "edit-record-empty"}
        open={editingRow !== null}
        onOpenChange={(open) => !open && setEditingRow(null)}
        record={editingRow?.record ?? null}
        onSave={(updated) => {
          if (editingRow && onEditRecord) {
            onEditRecord(editingRow.rowIndex, updated);
            setEditingRow(null);
          }
        }}
        isSaving={isUpdatingRecord}
      />
    </div>
  );
}
