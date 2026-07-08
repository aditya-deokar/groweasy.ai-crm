"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Edit2,
  Filter,
  LoaderCircle,
  PlusCircle,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { GrowEasyCrmRecord } from "@/lib/imports/contracts";
import {
  deleteLead,
  getLeads,
  leadsQueryKeys,
  updateLead,
  type LeadWithId,
} from "@/lib/leads/api";
import {
  SOURCE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
} from "@/lib/constants/leads";

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("ALL");
  const [source, setSource] = useState("ALL");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadWithId | null>(null);
  const [editForm, setEditForm] = useState<Partial<GrowEasyCrmRecord>>({});

  const { data, isLoading, isFetching } = useQuery({
    queryKey: leadsQueryKeys.list({ page, limit, search, status, source }),
    queryFn: () => getLeads({ page, limit, search, status, source }),
    placeholderData: (previousData) => previousData,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data: updateData,
    }: {
      id: string;
      data: Partial<GrowEasyCrmRecord>;
    }) => updateLead(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all });
      toast.success("Lead updated successfully.");
      setIsEditDialogOpen(false);
      setSelectedLead(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update lead.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadsQueryKeys.all });
      toast.success("Lead deleted successfully.");
      setIsDeleteDialogOpen(false);
      setSelectedLead(null);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete lead.");
    },
  });

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleResetFilters() {
    setSearchInput("");
    setSearch("");
    setStatus("ALL");
    setSource("ALL");
    setPage(1);
  }

  function openEditDialog(lead: LeadWithId) {
    setSelectedLead(lead);
    setEditForm({
      created_at: lead.created_at,
      name: lead.name,
      email: lead.email,
      country_code: lead.country_code,
      mobile_without_country_code: lead.mobile_without_country_code,
      company: lead.company,
      city: lead.city,
      state: lead.state,
      country: lead.country,
      lead_owner: lead.lead_owner,
      crm_status: lead.crm_status,
      crm_note: lead.crm_note,
      data_source: lead.data_source,
      possession_time: lead.possession_time,
      description: lead.description,
    });
    setIsEditDialogOpen(true);
  }

  function openDeleteDialog(lead: LeadWithId) {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  }

  function handleSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedLead) return;

    updateMutation.mutate({ id: selectedLead.id, data: editForm });
  }

  function handleDeleteConfirm() {
    if (!selectedLead) return;

    deleteMutation.mutate(selectedLead.id);
  }

  const leads = data?.leads ?? [];
  const totalLeads = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.pages ?? 1;

  return (
    <PageLayout
      title="Manage Leads"
      subtitle="View, edit, filter, and delete synchronized leads within GrowEasy CRM."
    >
      <div className="space-y-5">
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4">
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-wrap items-end gap-3"
            >
              <div className="min-w-[220px] flex-1 space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Search
                </label>
                <div className="relative">
                  <Input
                    placeholder="Search name, email, phone, company, city..."
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="h-9 pl-9"
                  />
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <FilterSelect
                label="CRM Status"
                value={status}
                options={STATUS_LABELS}
                allLabel="All Statuses"
                onChange={(nextValue) => {
                  setStatus(nextValue);
                  setPage(1);
                }}
              />

              <FilterSelect
                label="Lead Source"
                value={source}
                options={SOURCE_LABELS}
                allLabel="All Sources"
                onChange={(nextValue) => {
                  setSource(nextValue);
                  setPage(1);
                }}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="h-9 bg-[#0D652D] text-white hover:bg-[#0A4D22]"
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" />
                  Filter
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9"
                >
                  Clear
                </Button>
                <Button type="button" size="sm" variant="secondary" asChild>
                  <Link href="/import" className="h-9 gap-1.5">
                    <PlusCircle className="h-3.5 w-3.5" />
                    Import
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center space-y-3 py-16 text-muted-foreground">
                <LoaderCircle className="h-8 w-8 animate-spin text-[#0D652D]" />
                <p className="text-sm">Loading leads...</p>
              </div>
            ) : leads.length === 0 ? (
              <EmptyLeadsState />
            ) : (
              <div className="relative">
                {isFetching && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
                    <LoaderCircle className="h-7 w-7 animate-spin text-[#0D652D]" />
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <LeadTableHead>Name</LeadTableHead>
                        <LeadTableHead>Contact</LeadTableHead>
                        <LeadTableHead>Company / Location</LeadTableHead>
                        <LeadTableHead>Status</LeadTableHead>
                        <LeadTableHead>Source / Owner</LeadTableHead>
                        <LeadTableHead>Lead Date</LeadTableHead>
                        <LeadTableHead>Note</LeadTableHead>
                        <LeadTableHead align="right">Actions</LeadTableHead>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="transition-colors hover:bg-muted/20"
                        >
                          <LeadTableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-foreground">
                                {formatOptional(lead.name)}
                              </span>
                              {lead.description && (
                                <span
                                  className="max-w-[180px] truncate text-xs text-muted-foreground"
                                  title={lead.description}
                                >
                                  {lead.description}
                                </span>
                              )}
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            <div className="flex flex-col space-y-0.5 text-xs">
                              <span className="font-medium text-foreground">
                                {formatOptional(lead.email)}
                              </span>
                              <span className="text-muted-foreground">
                                {formatPhone(lead)}
                              </span>
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-sm text-foreground">
                                {formatOptional(lead.company)}
                              </span>
                              <span
                                className="max-w-[220px] truncate text-xs text-muted-foreground"
                                title={formatLocation(lead)}
                              >
                                {formatLocation(lead)}
                              </span>
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            {lead.crm_status ? (
                              <Badge
                                variant="outline"
                                className={
                                  STATUS_COLORS[lead.crm_status] ||
                                  "bg-secondary text-secondary-foreground"
                                }
                              >
                                {STATUS_LABELS[lead.crm_status] || lead.crm_status}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </LeadTableCell>

                          <LeadTableCell>
                            <div className="flex flex-col gap-1">
                              {lead.data_source ? (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-xs capitalize"
                                >
                                  {SOURCE_LABELS[lead.data_source] ||
                                    lead.data_source}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatOptional(lead.lead_owner)}
                              </span>
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                              <span>{formatDateValue(lead.created_at)}</span>
                              {lead.possession_time && (
                                <span>{lead.possession_time}</span>
                              )}
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            <span
                              className="block max-w-[220px] truncate text-xs text-muted-foreground"
                              title={lead.crm_note ?? ""}
                            >
                              {formatOptional(lead.crm_note)}
                            </span>
                          </LeadTableCell>

                          <LeadTableCell align="right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(lead)}
                                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                aria-label={`Edit ${lead.name ?? "lead"}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openDeleteDialog(lead)}
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                aria-label={`Delete ${lead.name ?? "lead"}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </LeadTableCell>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t bg-muted/20 p-3.5">
                  <div className="text-xs text-muted-foreground">
                    {(page - 1) * limit + 1}-{Math.min(page * limit, totalLeads)} of{" "}
                    {totalLeads} leads
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                      disabled={page === 1}
                      className="h-7 gap-1 text-xs"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Prev
                    </Button>
                    <span className="px-1.5 text-xs font-medium">
                      {page} / {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                      }
                      disabled={page === totalPages || totalPages === 0}
                      className="h-7 gap-1 text-xs"
                    >
                      Next
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="flex max-h-[85vh] w-[90vw] flex-col gap-5 overflow-y-auto p-6 sm:max-w-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-base font-semibold">Edit Lead</DialogTitle>
            <DialogDescription>Modify lead details and save to CRM.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <LeadInput label="Name" value={editForm.name} onChange={(value) => updateEditField("name", value)} />
              <LeadInput label="Email" type="email" value={editForm.email} onChange={(value) => updateEditField("email", value)} />
              <LeadInput label="Country Code" value={editForm.country_code} onChange={(value) => updateEditField("country_code", value)} />
              <LeadInput label="Mobile" value={editForm.mobile_without_country_code} onChange={(value) => updateEditField("mobile_without_country_code", value)} />
              <LeadInput label="Company" value={editForm.company} onChange={(value) => updateEditField("company", value)} />
              <LeadInput label="Lead Owner" value={editForm.lead_owner} onChange={(value) => updateEditField("lead_owner", value)} />
              <LeadInput label="City" value={editForm.city} onChange={(value) => updateEditField("city", value)} />
              <LeadInput label="State" value={editForm.state} onChange={(value) => updateEditField("state", value)} />
              <LeadInput label="Country" value={editForm.country} onChange={(value) => updateEditField("country", value)} />
              <LeadInput label="Lead Date" value={editForm.created_at} onChange={(value) => updateEditField("created_at", value)} />
              <LeadInput label="Possession Time" value={editForm.possession_time} onChange={(value) => updateEditField("possession_time", value)} />

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Status
                </label>
                <select
                  value={editForm.crm_status || ""}
                  onChange={(event) => updateEditField("crm_status", event.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <option value="">No Status</option>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Source
                </label>
                <select
                  value={editForm.data_source || ""}
                  onChange={(event) => updateEditField("data_source", event.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <option value="">No Source</option>
                  {Object.entries(SOURCE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <LeadTextarea label="Note" value={editForm.crm_note} onChange={(value) => updateEditField("crm_note", value)} />
              <LeadTextarea label="Description" value={editForm.description} onChange={(value) => updateEditField("description", value)} />
            </div>

            <DialogFooter className="border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="bg-[#0D652D] text-white hover:bg-[#0A4D22]"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[90vw] gap-5 p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Trash2 className="h-4.5 w-4.5 text-destructive" />
              Delete Lead
            </DialogTitle>
            <DialogDescription>
              This will permanently remove{" "}
              <strong className="text-foreground">
                {selectedLead?.name ?? "this lead"}
              </strong>{" "}
              from your CRM. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );

  function updateEditField(key: keyof GrowEasyCrmRecord, value: string) {
    setEditForm((currentForm) => ({ ...currentForm, [key]: value }));
  }
}

function FilterSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  allLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-[170px] space-y-1.5">
      <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      >
        <option value="ALL">{allLabel}</option>
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function EmptyLeadsState() {
  return (
    <div className="space-y-3 py-16 text-center text-muted-foreground">
      <p className="text-base font-medium">No leads found</p>
      <p className="text-sm">Try adjusting your filters or import new leads.</p>
      <Button size="sm" className="mt-2 bg-[#0D652D] text-white hover:bg-[#0A4D22]" asChild>
        <Link href="/import">Go to Importer</Link>
      </Button>
    </div>
  );
}

function LeadTableHead({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      className={`p-3.5 text-[11px] font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase ${
        align === "right" ? "text-right" : ""
      }`}
    >
      {children}
    </th>
  );
}

function LeadTableCell({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <td className={`p-3.5 ${align === "right" ? "text-right" : ""}`}>
      {children}
    </td>
  );
}

function LeadInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </label>
      <Input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function LeadTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5 sm:col-span-2">
      <label className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="flex min-h-[64px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}

function formatOptional(value: string | null | undefined): string {
  const normalized = value?.trim();
  return normalized ? normalized : "-";
}

function formatPhone(lead: LeadWithId): string {
  const mobile = lead.mobile_without_country_code?.trim();
  if (!mobile) return "-";

  const countryCode = lead.country_code?.trim().replace(/^\+/, "");
  return countryCode ? `+${countryCode} ${mobile}` : mobile;
}

function formatLocation(lead: LeadWithId): string {
  const location = [lead.city, lead.state, lead.country]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");

  return location || "-";
}

function formatDateValue(value: string | null | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return "-";

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
