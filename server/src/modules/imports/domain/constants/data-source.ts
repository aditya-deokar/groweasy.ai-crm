export const DATA_SOURCE_VALUES = [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
] as const;

export type DataSource = (typeof DATA_SOURCE_VALUES)[number];

export function isDataSource(value: string): value is DataSource {
  return DATA_SOURCE_VALUES.includes(value as DataSource);
}
