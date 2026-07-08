import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const importJobStatusEnum = pgEnum('import_job_status', [
  'UPLOADED',
  'PARSED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const importBatchStatusEnum = pgEnum('import_batch_status', [
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
]);

export const crmStatusEnum = pgEnum('crm_status', [
  'GOOD_LEAD_FOLLOW_UP',
  'DID_NOT_CONNECT',
  'BAD_LEAD',
  'SALE_DONE',
]);

export const dataSourceEnum = pgEnum('data_source', [
  'leads_on_demand',
  'meridian_tower',
  'eden_park',
  'varah_swamy',
  'sarjapur_plots',
]);

export const importJobs = pgTable(
  'import_jobs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    originalFileName: text('original_file_name').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    fileSha256: text('file_sha256').notNull(),
    status: importJobStatusEnum('status').notNull().default('UPLOADED'),
    headers: jsonb('headers').$type<string[]>().notNull().default([]),
    totalRows: integer('total_rows').notNull().default(0),
    emptyRowCount: integer('empty_row_count').notNull().default(0),
    totalBatches: integer('total_batches').notNull().default(0),
    processedRows: integer('processed_rows').notNull().default(0),
    importedCount: integer('imported_count').notNull().default(0),
    skippedCount: integer('skipped_count').notNull().default(0),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('import_jobs_status_idx').on(table.status),
    index('import_jobs_created_at_idx').on(table.createdAt),
    index('import_jobs_file_sha256_idx').on(table.fileSha256),
  ]
);

export const importRows = pgTable(
  'import_rows',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    importJobId: uuid('import_job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    rowIndex: integer('row_index').notNull(),
    rawData: jsonb('raw_data').$type<Record<string, string>>().notNull(),
    rawTextHash: text('raw_text_hash').notNull(),
    parseWarnings: jsonb('parse_warnings').$type<string[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('import_rows_job_row_index_idx').on(table.importJobId, table.rowIndex),
    index('import_rows_import_job_id_idx').on(table.importJobId),
  ]
);

export const importBatches = pgTable(
  'import_batches',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    importJobId: uuid('import_job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    batchIndex: integer('batch_index').notNull(),
    status: importBatchStatusEnum('status').notNull().default('PENDING'),
    rowStartIndex: integer('row_start_index').notNull(),
    rowEndIndex: integer('row_end_index').notNull(),
    rowCount: integer('row_count').notNull(),
    retryCount: integer('retry_count').notNull().default(0),
    modelName: text('model_name'),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    errorMessage: text('error_message'),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('import_batches_job_batch_index_idx').on(table.importJobId, table.batchIndex),
    index('import_batches_status_idx').on(table.status),
  ]
);

export const crmImportRecords = pgTable(
  'crm_import_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    importJobId: uuid('import_job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    importRowId: uuid('import_row_id')
      .notNull()
      .references(() => importRows.id, { onDelete: 'cascade' }),
    rowIndex: integer('row_index').notNull(),
    createdAtValue: text('created_at_value'),
    name: text('name'),
    email: text('email'),
    countryCode: text('country_code'),
    mobileWithoutCountryCode: text('mobile_without_country_code'),
    company: text('company'),
    city: text('city'),
    state: text('state'),
    country: text('country'),
    leadOwner: text('lead_owner'),
    crmStatus: crmStatusEnum('crm_status'),
    crmNote: text('crm_note'),
    dataSource: dataSourceEnum('data_source'),
    possessionTime: text('possession_time'),
    description: text('description'),
    confidence: jsonb('confidence').$type<Record<string, number>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('crm_import_records_import_job_id_idx').on(table.importJobId),
    index('crm_import_records_email_idx').on(table.email),
    index('crm_import_records_mobile_idx').on(table.mobileWithoutCountryCode),
  ]
);

export const crmSkippedRecords = pgTable(
  'crm_skipped_records',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    importJobId: uuid('import_job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    importRowId: uuid('import_row_id')
      .notNull()
      .references(() => importRows.id, { onDelete: 'cascade' }),
    rowIndex: integer('row_index').notNull(),
    reason: text('reason').notNull(),
    rawData: jsonb('raw_data').$type<Record<string, string>>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('crm_skipped_records_import_job_id_idx').on(table.importJobId),
    uniqueIndex('crm_skipped_records_job_row_index_idx').on(table.importJobId, table.rowIndex),
  ]
);

export const importEvents = pgTable(
  'import_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    importJobId: uuid('import_job_id')
      .notNull()
      .references(() => importJobs.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    message: text('message').notNull(),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    visibleToUser: boolean('visible_to_user').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('import_events_import_job_id_idx').on(table.importJobId)]
);

export type ImportJobRow = typeof importJobs.$inferSelect;
export type NewImportJobRow = typeof importJobs.$inferInsert;
export type ImportRowRow = typeof importRows.$inferSelect;
export type NewImportRowRow = typeof importRows.$inferInsert;
