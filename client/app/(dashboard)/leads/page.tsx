"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Edit2,
  Filter,
  LoaderCircle,
  PlusCircle,
  Search,
  Trash2,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { PageLayout } from "@/components/layout/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="space-y-4">
        {/* Apple iOS Spotlight Floating Control Bar */}
        <div className="p-3 lg:p-3.5 rounded-2xl lg:rounded-3xl border border-border/70 dark:border-white/[0.08] bg-card/85 dark:bg-card/75 backdrop-blur-2xl shadow-lg shadow-black/5 dark:shadow-black/20 transition-all">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5"
          >
            <div className="relative w-full sm:flex-1 sm:min-w-[240px]">
              <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search leads by name, email, phone, company..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className="h-10 pl-10 pr-4 rounded-xl border-border/60 bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.07] focus-visible:bg-background text-xs font-medium transition-all shadow-2xs w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
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
            </div>

            <div className="grid grid-cols-3 gap-2 w-full sm:flex sm:w-auto sm:items-center">
              <Button
                type="submit"
                size="sm"
                className="h-10 rounded-xl px-3 bg-[#0D652D] text-white hover:bg-[#0A4D22] font-semibold text-xs shadow-sm transition-all cursor-pointer w-full sm:w-auto flex items-center justify-center"
              >
                <Filter className="mr-1.5 h-3.5 w-3.5 shrink-0" />
                Filter
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 rounded-xl px-3 border-border/60 bg-foreground/[0.02] dark:bg-white/[0.04] hover:bg-foreground/[0.06] text-xs text-muted-foreground hover:text-foreground font-semibold cursor-pointer w-full sm:w-auto flex items-center justify-center"
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 rounded-xl px-3 border-border/70 bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.08] text-foreground font-semibold text-xs shadow-2xs cursor-pointer w-full sm:w-auto"
                asChild
              >
                <Link href="/import" className="gap-1.5 flex items-center justify-center">
                  <PlusCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  Import
                </Link>
              </Button>
            </div>
          </form>
        </div>

        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {isLoading ? (
              <LeadsTableSkeleton rows={6} />
            ) : leads.length === 0 ? (
              <EmptyLeadsState />
            ) : (
              <div className="relative">
                {isFetching && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
                    <LoaderCircle className="h-7 w-7 animate-spin text-[#0D652D]" />
                  </div>
                )}

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-gradient-to-r from-foreground/[0.05] via-foreground/[0.08] to-foreground/[0.05] dark:from-white/[0.06] dark:via-white/[0.09] dark:to-white/[0.06] border-b border-border/80 dark:border-white/[0.12] backdrop-blur-2xl">
                      <tr>
                        <LeadTableHead>Lead Profile</LeadTableHead>
                        <LeadTableHead>Contact Info</LeadTableHead>
                        <LeadTableHead>Company & Location</LeadTableHead>
                        <LeadTableHead>CRM Status</LeadTableHead>
                        <LeadTableHead>Source / Owner</LeadTableHead>
                        <LeadTableHead>Date Added</LeadTableHead>
                        <LeadTableHead>Notes</LeadTableHead>
                        <LeadTableHead align="right">Actions</LeadTableHead>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {leads.map((lead) => (
                        <tr
                          key={lead.id}
                          className="group/row transition-all duration-200 hover:bg-foreground/[0.04] dark:hover:bg-white/[0.04]"
                        >
                          <LeadTableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-xs shrink-0 shadow-2xs group-hover/row:scale-105 transition-transform duration-200">
                                {getLeadInitials(lead.name)}
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-semibold text-sm text-foreground group-hover/row:text-emerald-400 transition-colors truncate">
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
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            <div className="flex flex-col space-y-0.5">
                              <span className="font-medium text-xs text-foreground truncate">
                                {formatOptional(lead.email)}
                              </span>
                              <span className="text-[11px] font-mono text-muted-foreground">
                                {formatPhone(lead)}
                              </span>
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-xs text-foreground">
                                {formatOptional(lead.company)}
                              </span>
                              <span
                                className="max-w-[200px] truncate text-[11px] text-muted-foreground"
                                title={formatLocation(lead)}
                              >
                                {formatLocation(lead)}
                              </span>
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            {lead.crm_status ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                {STATUS_LABELS[lead.crm_status] || lead.crm_status}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </LeadTableCell>

                          <LeadTableCell>
                            <div className="flex flex-col gap-1">
                              {lead.data_source ? (
                                <span className="inline-flex items-center w-fit px-2.5 py-1 rounded-full text-[11px] font-medium bg-foreground/[0.06] dark:bg-white/[0.08] text-foreground border border-border/60">
                                  {SOURCE_LABELS[lead.data_source] ||
                                    lead.data_source}
                                </span>
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
                                <span className="text-[11px]">{lead.possession_time}</span>
                              )}
                            </div>
                          </LeadTableCell>

                          <LeadTableCell>
                            <span
                              className="block max-w-[200px] truncate text-xs text-muted-foreground"
                              title={lead.crm_note ?? ""}
                            >
                              {formatOptional(lead.crm_note)}
                            </span>
                          </LeadTableCell>

                          <LeadTableCell align="right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditDialog(lead)}
                                className="h-8 w-8 rounded-xl bg-foreground/[0.04] hover:bg-foreground/[0.1] text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
                                aria-label={`Edit ${lead.name ?? "lead"}`}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openDeleteDialog(lead)}
                                className="h-8 w-8 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all cursor-pointer shadow-2xs"
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

                <MobileLeadsCardList
                  leads={leads}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50 bg-foreground/[0.02] dark:bg-white/[0.02] px-4 sm:px-5 py-3.5">
                  <div className="text-xs font-medium text-muted-foreground">
                    {(page - 1) * limit + 1}-{Math.min(page * limit, totalLeads)} of{" "}
                    <span className="text-foreground font-semibold">{totalLeads}</span> leads
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                      disabled={page === 1}
                      className="h-8 rounded-xl px-3 gap-1.5 text-xs font-medium border-border/60 bg-card hover:bg-foreground/[0.05] cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Prev
                    </Button>
                    <span className="px-2 text-xs font-semibold text-foreground">
                      {page} / {totalPages || 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((currentPage) => Math.min(totalPages, currentPage + 1))
                      }
                      disabled={page === totalPages || totalPages === 0}
                      className="h-8 rounded-xl px-3 gap-1.5 text-xs font-medium border-border/60 bg-card hover:bg-foreground/[0.05] cursor-pointer"
                    >
                      Next
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="flex max-h-[85vh] w-[92vw] flex-col gap-5 overflow-y-auto p-6 sm:max-w-2xl">
          <DialogHeader className="border-b border-border/60 pb-4">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              Edit Lead Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify lead contact details, status, and notes, then save your changes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveEdit} className="space-y-5">
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <LeadInput label="Lead Name" value={editForm.name} onChange={(value) => updateEditField("name", value)} />
              <LeadInput label="Email Address" type="email" value={editForm.email} onChange={(value) => updateEditField("email", value)} />
              <LeadInput label="Country Code" value={editForm.country_code} onChange={(value) => updateEditField("country_code", value)} />
              <LeadInput label="Mobile Number" value={editForm.mobile_without_country_code} onChange={(value) => updateEditField("mobile_without_country_code", value)} />
              <LeadInput label="Company Name" value={editForm.company} onChange={(value) => updateEditField("company", value)} />
              <LeadInput label="Lead Owner" value={editForm.lead_owner} onChange={(value) => updateEditField("lead_owner", value)} />
              <LeadInput label="City" value={editForm.city} onChange={(value) => updateEditField("city", value)} />
              <LeadInput label="State / Province" value={editForm.state} onChange={(value) => updateEditField("state", value)} />
              <LeadInput label="Country" value={editForm.country} onChange={(value) => updateEditField("country", value)} />
              <LeadInput label="Lead Date" value={editForm.created_at} onChange={(value) => updateEditField("created_at", value)} />
              <LeadInput label="Possession Time" value={editForm.possession_time} onChange={(value) => updateEditField("possession_time", value)} />

              <FormSelectDropdown
                label="CRM Status"
                value={editForm.crm_status || ""}
                options={STATUS_LABELS}
                placeholder="No Status"
                onChange={(value) => updateEditField("crm_status", value)}
              />

              <FormSelectDropdown
                label="Lead Source"
                value={editForm.data_source || ""}
                options={SOURCE_LABELS}
                placeholder="No Source"
                onChange={(value) => updateEditField("data_source", value)}
              />

              <LeadTextarea label="Note" value={editForm.crm_note} onChange={(value) => updateEditField("crm_note", value)} />
              <LeadTextarea label="Description" value={editForm.description} onChange={(value) => updateEditField("description", value)} />
            </div>

            <DialogFooter className="border-t border-border/60 pt-4 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(false)}
                className="h-10 rounded-xl px-4 border-border/70 bg-foreground/[0.04] dark:bg-white/[0.05] hover:bg-foreground/[0.08] text-xs font-medium text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateMutation.isPending}
                className="h-10 rounded-xl px-5 bg-[#0D652D] text-white hover:bg-[#0A4D22] text-xs font-medium shadow-sm transition-all cursor-pointer"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[90vw] gap-5 p-6 sm:max-w-md">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive mb-1">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              Delete Lead
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              This will permanently remove{" "}
              <strong className="text-foreground font-semibold">
                {selectedLead?.name ?? "this lead"}
              </strong>{" "}
              from your GrowEasy CRM database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-10 rounded-xl px-4 border-border/70 bg-foreground/[0.04] hover:bg-foreground/[0.08] text-xs font-medium cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="h-10 rounded-xl px-5 text-xs font-medium shadow-sm cursor-pointer"
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
  const currentLabel = value === "ALL" ? allLabel : options[value] || allLabel;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-between gap-2 h-10 w-full sm:w-auto sm:min-w-[155px] rounded-xl border border-border/60 bg-foreground/[0.04] dark:bg-white/[0.06] hover:bg-foreground/[0.07] px-3.5 text-xs font-medium text-foreground shadow-2xs transition-all focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none cursor-pointer select-none"
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[170px]">
        <DropdownMenuItem
          onClick={() => onChange("ALL")}
          className="justify-between"
        >
          <span>{allLabel}</span>
          {value === "ALL" && <Check className="w-3.5 h-3.5 text-emerald-500" />}
        </DropdownMenuItem>
        {Object.entries(options).map(([optionValue, optionLabel]) => (
          <DropdownMenuItem
            key={optionValue}
            onClick={() => onChange(optionValue)}
            className="justify-between"
          >
            <span>{optionLabel}</span>
            {value === optionValue && (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LeadsTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      {/* Desktop Table Skeleton */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-gradient-to-r from-foreground/[0.05] via-foreground/[0.08] to-foreground/[0.05] dark:from-white/[0.06] dark:via-white/[0.09] dark:to-white/[0.06] border-b border-border/80 dark:border-white/[0.12] backdrop-blur-2xl">
            <tr>
              <LeadTableHead>Lead Profile</LeadTableHead>
              <LeadTableHead>Contact Info</LeadTableHead>
              <LeadTableHead>Company & Location</LeadTableHead>
              <LeadTableHead>CRM Status</LeadTableHead>
              <LeadTableHead>Source / Owner</LeadTableHead>
              <LeadTableHead>Date Added</LeadTableHead>
              <LeadTableHead>Notes</LeadTableHead>
              <LeadTableHead align="right">Actions</LeadTableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {Array.from({ length: rows }).map((_, i) => (
              <tr
                key={i}
                className="transition-colors hover:bg-foreground/[0.02] dark:hover:bg-white/[0.02]"
              >
                <LeadTableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20" />
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                  </div>
                </LeadTableCell>
                <LeadTableCell>
                  <div className="flex flex-col space-y-1.5">
                    <Skeleton className="h-3.5 w-32 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </LeadTableCell>
                <LeadTableCell>
                  <div className="flex flex-col space-y-1.5">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </LeadTableCell>
                <LeadTableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </LeadTableCell>
                <LeadTableCell>
                  <Skeleton className="h-5 w-16 rounded-md" />
                </LeadTableCell>
                <LeadTableCell>
                  <Skeleton className="h-3.5 w-20 rounded" />
                </LeadTableCell>
                <LeadTableCell>
                  <Skeleton className="h-3.5 w-36 rounded" />
                </LeadTableCell>
                <LeadTableCell align="right">
                  <div className="flex justify-end gap-1.5">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-8 w-8 rounded-xl" />
                  </div>
                </LeadTableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List Skeleton */}
      <div className="md:hidden p-3 sm:p-4 space-y-3.5">
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/70 dark:border-white/[0.08] bg-card/90 dark:bg-card/75 p-4 shadow-sm space-y-3.5"
          >
            {/* Top Header Skeleton */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Skeleton className="w-10 h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full shrink-0" />
            </div>

            {/* Middle Section Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl bg-muted/40 dark:bg-white/[0.02] p-3 border border-border/50">
              <div className="space-y-1.5">
                <Skeleton className="h-2.5 w-14 rounded" />
                <Skeleton className="h-3.5 w-36 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-border/50 pt-2 sm:pt-0 sm:pl-3">
                <Skeleton className="h-2.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>

            {/* Bottom Footer Skeleton */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded-md" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
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

function MobileLeadsCardList({
  leads,
  onEdit,
  onDelete,
}: {
  leads: LeadWithId[];
  onEdit: (lead: LeadWithId) => void;
  onDelete: (lead: LeadWithId) => void;
}) {
  return (
    <div className="md:hidden p-3 sm:p-4 space-y-3.5">
      {leads.map((lead) => {
        const hasEmail = Boolean(lead.email && lead.email !== "-");
        const phoneText = formatPhone(lead);
        const hasPhone = Boolean(phoneText && phoneText !== "-");
        const hasCompany = Boolean(lead.company && lead.company !== "-");
        const locationText = formatLocation(lead);
        const hasLocation = Boolean(locationText && locationText !== "-");

        return (
          <div
            key={lead.id}
            className="rounded-2xl border border-border/70 dark:border-white/[0.08] bg-card/90 dark:bg-card/75 p-4 shadow-sm hover:border-emerald-500/40 transition-all space-y-3.5"
          >
            {/* Top Header: Avatar + Lead Name + CRM Status Badge */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-sm shrink-0 shadow-2xs">
                  {getLeadInitials(lead.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {formatOptional(lead.name)}
                  </p>
                  {lead.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {lead.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                {lead.crm_status ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    {STATUS_LABELS[lead.crm_status] || lead.crm_status}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-foreground/5 dark:bg-white/5 text-muted-foreground border border-border/60">
                    New Lead
                  </span>
                )}
              </div>
            </div>

            {/* Middle Section: Contact & Company Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl bg-muted/40 dark:bg-white/[0.02] p-3 border border-border/50 text-xs">
              {/* Contact Column */}
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest block">
                  Contact
                </span>
                {hasEmail || hasPhone ? (
                  <div className="space-y-1">
                    {hasEmail && (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{lead.email}</span>
                      </div>
                    )}
                    {hasPhone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-mono text-[11px]">{phoneText}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-[11px]">
                    No contact details provided
                  </p>
                )}
              </div>

              {/* Company & Location Column */}
              <div className="space-y-1 min-w-0 border-t sm:border-t-0 sm:border-l border-border/50 pt-2 sm:pt-0 sm:pl-3">
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest block">
                  Company & Location
                </span>
                {hasCompany || hasLocation ? (
                  <div className="space-y-1">
                    {hasCompany && (
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{lead.company}</span>
                      </div>
                    )}
                    {hasLocation && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate text-[11px]">{locationText}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground italic text-[11px]">
                    Independent / No company info
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Footer Section: Source & Date + Actions */}
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-foreground/[0.06] dark:bg-white/[0.08] text-[10px] font-semibold text-foreground uppercase tracking-wide shrink-0 border border-border/50">
                  {SOURCE_LABELS[lead.data_source || ""] || lead.data_source || "WEB"}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                  <Calendar className="w-3 h-3 shrink-0" />
                  {formatDateValue(lead.created_at)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(lead)}
                  className="h-8 px-3 rounded-lg text-xs font-medium border-border/70 bg-background/50 hover:bg-muted"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(lead)}
                  className="h-8 px-3 rounded-lg text-xs font-medium border-border/70 bg-background/50 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getLeadInitials(name: string | null | undefined): string {
  if (!name || !name.trim()) return "L";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
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
      className={`px-4 py-4 text-[11px] font-semibold tracking-wider whitespace-nowrap text-foreground/85 dark:text-white/90 uppercase select-none ${
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
    <td className={`px-4 py-3.5 align-middle ${align === "right" ? "text-right" : ""}`}>
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
      <label className="text-xs font-semibold text-foreground/85">
        {label}
      </label>
      <Input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-xl border-border/60 bg-foreground/[0.04] dark:bg-white/[0.05] hover:bg-foreground/[0.06] focus-visible:bg-background px-3.5 text-xs font-medium text-foreground transition-all shadow-2xs"
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
      <label className="text-xs font-semibold text-foreground/85">
        {label}
      </label>
      <textarea
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="flex min-h-[72px] w-full rounded-xl border border-border/60 bg-foreground/[0.04] dark:bg-white/[0.05] hover:bg-foreground/[0.06] focus-visible:bg-background p-3.5 text-xs font-medium text-foreground shadow-2xs transition-all placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none"
      />
    </div>
  );
}

function FormSelectDropdown({
  label,
  value,
  options,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const currentLabel = value && options[value] ? options[value] : placeholder;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground/85">
        {label}
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-xl border border-border/60 bg-foreground/[0.04] dark:bg-white/[0.05] hover:bg-foreground/[0.07] px-3.5 text-xs font-medium text-foreground shadow-2xs transition-all focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:outline-none cursor-pointer"
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-[200px]">
          <DropdownMenuItem onClick={() => onChange("")} className="justify-between">
            <span className="text-muted-foreground">{placeholder}</span>
            {!value && <Check className="w-3.5 h-3.5 text-emerald-500" />}
          </DropdownMenuItem>
          {Object.entries(options).map(([optionValue, optionLabel]) => (
            <DropdownMenuItem
              key={optionValue}
              onClick={() => onChange(optionValue)}
              className="justify-between"
            >
              <span>{optionLabel}</span>
              {value === optionValue && (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
