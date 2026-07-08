/**
 * Shared lead/CRM constants.
 * Extracted from leads/page.tsx to eliminate hardcoded duplication.
 */

export const CRM_STATUS_VALUES = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP: "Good Lead - Follow Up",
  DID_NOT_CONNECT: "Did Not Connect",
  BAD_LEAD: "Bad Lead",
  SALE_DONE: "Sale Done",
};

export const SOURCE_LABELS: Record<string, string> = {
  leads_on_demand: "Leads on Demand",
  meridian_tower: "Meridian Tower",
  eden_park: "Eden Park",
  varah_swamy: "Varah Swamy",
  sarjapur_plots: "Sarjapur Plots",
};

export const STATUS_COLORS: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  DID_NOT_CONNECT:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
  BAD_LEAD:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800",
  SALE_DONE:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
};
