export const CRM_STATUS_VALUES = [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
] as const;

export type CrmStatus = (typeof CRM_STATUS_VALUES)[number];

export function isCrmStatus(value: string): value is CrmStatus {
  return CRM_STATUS_VALUES.includes(value as CrmStatus);
}
