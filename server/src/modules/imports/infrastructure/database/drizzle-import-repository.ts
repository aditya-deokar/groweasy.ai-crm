import { and, asc, count, desc, eq, gt, inArray, lte, gte, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import type { Database } from '../../../../db/index.js';
import {
  crmImportRecords,
  crmSkippedRecords,
  importBatches,
  importEvents,
  importJobs,
  importRows,
} from '../../../../db/schema.js';
import type { ImportPreview } from '../../domain/entities/import-job.js';
import type {
  CreateImportPreviewInput,
  CreateImportBatchesInput,
  GetImportResultInput,
  ImportBatchSummary,
  ImportEventSummary,
  ImportJobSummary,
  ImportRepository,
  ImportResult,
  ImportResultBatchSummary,
  ImportStatusResult,
  PersistBatchResultInput,
  PersistBatchResultSummary,
  PersistedImportRow,
} from '../../domain/ports/import-repository.port.js';
import type { CrmRecord } from '../../domain/entities/crm-record.js';
import { planImportBatches } from '../../domain/services/import-batch-planner.js';

const INSERT_CHUNK_SIZE = 500;
const ERROR_MESSAGE_MAX_LENGTH = 500;

interface BatchStatusCounts {
  PENDING: number;
  PROCESSING: number;
  COMPLETED: number;
  FAILED: number;
  CANCELLED: number;
}

export class DrizzleImportRepository implements ImportRepository {
  public constructor(private readonly database: Database) {}

  public async createPreview(input: CreateImportPreviewInput): Promise<ImportPreview> {
    return this.database.transaction(async (tx) => {
      const [job] = await tx
        .insert(importJobs)
        .values({
          originalFileName: input.file.originalName,
          fileSizeBytes: input.file.sizeBytes,
          fileSha256: input.file.sha256,
          status: 'PARSED',
          headers: input.headers,
          totalRows: input.rows.length,
          emptyRowCount: input.emptyRowCount,
          processedRows: input.skippedRows.length,
          skippedCount: input.skippedRows.length,
          updatedAt: new Date(),
        })
        .returning();

      if (!job) {
        throw new Error('Failed to create import job.');
      }

      const insertedRows: Array<{
        id: string;
        rowIndex: number;
        rawData: Record<string, string>;
      }> = [];

      for (let start = 0; start < input.rows.length; start += INSERT_CHUNK_SIZE) {
        const chunk = input.rows.slice(start, start + INSERT_CHUNK_SIZE);

        if (chunk.length === 0) continue;

        const createdRows = await tx
          .insert(importRows)
          .values(
            chunk.map((row) => ({
              importJobId: job.id,
              rowIndex: row.rowIndex,
              rawData: row.rawData,
              rawTextHash: row.rawTextHash,
              parseWarnings: row.parseWarnings,
            }))
          )
          .returning({
            id: importRows.id,
            rowIndex: importRows.rowIndex,
            rawData: importRows.rawData,
          });

        insertedRows.push(...createdRows);
      }

      const rowByIndex = new Map(insertedRows.map((row) => [row.rowIndex, row]));
      const skippedRowsToInsert = input.skippedRows
        .map((skipped) => {
          const row = rowByIndex.get(skipped.rowIndex);
          if (!row) return null;

          return {
            importJobId: job.id,
            importRowId: row.id,
            rowIndex: skipped.rowIndex,
            reason: skipped.reason,
            rawData: row.rawData,
          };
        })
        .filter((value) => value !== null);

      if (skippedRowsToInsert.length > 0) {
        await tx.insert(crmSkippedRecords).values(skippedRowsToInsert);
      }

      const skippedReasonByIndex = new Map(
        input.skippedRows.map((row) => [row.rowIndex, row.reason])
      );
      const previewRows = input.rows.slice(0, input.previewRowLimit).map((row) => {
        const skipReason = skippedReasonByIndex.get(row.rowIndex);

        return {
          rowIndex: row.rowIndex,
          values: row.rawData,
          validationStatus: skipReason ? ('SKIPPED' as const) : ('CANDIDATE' as const),
          skipReason,
        };
      });

      await tx.insert(importEvents).values({
        importJobId: job.id,
        eventType: 'IMPORT_PREVIEW_CREATED',
        message: 'CSV preview created.',
        metadata: {
          originalFileName: input.file.originalName,
          fileSizeBytes: input.file.sizeBytes,
          totalRows: input.rows.length,
          candidateRows: input.validationSummary.candidateRowCount,
          skippedRows: input.validationSummary.skippedRowCount,
          warningCount: input.warningCount,
        },
        visibleToUser: true,
      });

      return {
        importId: job.id,
        status: job.status,
        file: {
          originalName: job.originalFileName,
          sizeBytes: job.fileSizeBytes,
          sha256: job.fileSha256,
        },
        headers: job.headers,
        previewRows,
        summary: {
          totalRows: job.totalRows,
          previewRowCount: previewRows.length,
          candidateRowCount: input.validationSummary.candidateRowCount,
          skippedRowCount: input.validationSummary.skippedRowCount,
          emptyRowCount: job.emptyRowCount,
          duplicateRowCount: input.validationSummary.duplicateRowCount,
          noContactRowCount: input.validationSummary.noContactRowCount,
          warningCount: input.warningCount,
        },
      };
    });
  }

  public async exists(importId: string): Promise<boolean> {
    const [job] = await this.database
      .select({ id: importJobs.id })
      .from(importJobs)
      .where(eq(importJobs.id, importId))
      .limit(1);

    return Boolean(job);
  }

  public async getJobSummary(importId: string): Promise<ImportJobSummary | null> {
    const [job] = await this.database
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, importId))
      .limit(1);

    return job ? mapJobSummary(job) : null;
  }

  public async markProcessing(importId: string, totalBatches: number): Promise<void> {
    await this.database
      .update(importJobs)
      .set({
        status: 'PROCESSING',
        totalBatches,
        errorMessage: null,
        confirmedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, importId));

    await this.recordEvent({
      importId,
      eventType: 'IMPORT_PROCESSING_STARTED',
      message: 'Import processing started.',
      metadata: {
        totalBatches,
      },
      visibleToUser: true,
    });
  }

  public async createBatches(input: CreateImportBatchesInput): Promise<ImportBatchSummary[]> {
    const existingBatches = await this.database
      .select()
      .from(importBatches)
      .where(eq(importBatches.importJobId, input.importId))
      .orderBy(asc(importBatches.batchIndex));

    if (existingBatches.length > 0) {
      return existingBatches.map(mapBatchSummary);
    }

    const rows = await this.database
      .select({
        rowIndex: importRows.rowIndex,
      })
      .from(importRows)
      .where(eq(importRows.importJobId, input.importId))
      .orderBy(asc(importRows.rowIndex));

    const skippedRowIndexes = await this.getSkippedRowIndexes(input.importId);
    const candidateRows = rows.filter((row) => !skippedRowIndexes.has(row.rowIndex));
    const plannedBatches = planImportBatches(
      candidateRows.map((row) => row.rowIndex),
      input.batchSize
    );
    const batchValues = plannedBatches.map((batch) => ({
        importJobId: input.importId,
        batchIndex: batch.batchIndex,
        rowStartIndex: batch.rowStartIndex,
        rowEndIndex: batch.rowEndIndex,
        rowCount: batch.rowCount,
      }));

    if (batchValues.length === 0) {
      return [];
    }

    const createdBatches = await this.database.insert(importBatches).values(batchValues).returning();
    await this.recordEvent({
      importId: input.importId,
      eventType: 'IMPORT_BATCHES_CREATED',
      message: 'AI import batches created.',
      metadata: {
        batchSize: input.batchSize,
        candidateRows: candidateRows.length,
        totalBatches: createdBatches.length,
      },
      visibleToUser: true,
    });

    return createdBatches.map(mapBatchSummary);
  }

  public async getProcessableBatches(
    importId: string,
    includeFailed: boolean
  ): Promise<ImportBatchSummary[]> {
    const statuses = includeFailed ? (['PENDING', 'FAILED'] as const) : (['PENDING'] as const);

    const batches = await this.database
      .select()
      .from(importBatches)
      .where(and(eq(importBatches.importJobId, importId), inArray(importBatches.status, statuses)))
      .orderBy(asc(importBatches.batchIndex));

    return batches.map(mapBatchSummary);
  }

  public async getRowsForBatch(
    importId: string,
    rowStartIndex: number,
    rowEndIndex: number
  ): Promise<PersistedImportRow[]> {
    const rows = await this.database
      .select()
      .from(importRows)
      .where(
        and(
          eq(importRows.importJobId, importId),
          gte(importRows.rowIndex, rowStartIndex),
          lte(importRows.rowIndex, rowEndIndex)
        )
      )
      .orderBy(asc(importRows.rowIndex));

    const skippedRowIndexes = await this.getSkippedRowIndexes(importId);

    return rows.filter((row) => !skippedRowIndexes.has(row.rowIndex)).map((row) => ({
      id: row.id,
      rowIndex: row.rowIndex,
      rawData: row.rawData,
      rawTextHash: row.rawTextHash,
      parseWarnings: row.parseWarnings ?? undefined,
    }));
  }

  public async markBatchProcessing(batchId: string): Promise<void> {
    const [batch] = await this.database
      .update(importBatches)
      .set({
        status: 'PROCESSING',
        retryCount: sql`${importBatches.retryCount} + 1`,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(importBatches.id, batchId))
      .returning({
        importJobId: importBatches.importJobId,
        batchIndex: importBatches.batchIndex,
        rowCount: importBatches.rowCount,
        retryCount: importBatches.retryCount,
      });

    if (!batch) return;

    await this.recordEvent({
      importId: batch.importJobId,
      eventType: 'IMPORT_BATCH_PROCESSING_STARTED',
      message: `Batch ${batch.batchIndex + 1} processing started.`,
      metadata: {
        batchId,
        batchIndex: batch.batchIndex,
        rowCount: batch.rowCount,
        attempt: batch.retryCount,
      },
      visibleToUser: false,
    });
  }

  public async markBatchCompleted(batchId: string): Promise<void> {
    const [batch] = await this.database
      .update(importBatches)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(importBatches.id, batchId))
      .returning({
        importJobId: importBatches.importJobId,
        batchIndex: importBatches.batchIndex,
        rowCount: importBatches.rowCount,
        retryCount: importBatches.retryCount,
      });

    if (!batch) return;

    await this.recordEvent({
      importId: batch.importJobId,
      eventType: 'IMPORT_BATCH_COMPLETED',
      message: `Batch ${batch.batchIndex + 1} completed.`,
      metadata: {
        batchId,
        batchIndex: batch.batchIndex,
        rowCount: batch.rowCount,
        retryCount: batch.retryCount,
      },
      visibleToUser: false,
    });
  }

  public async markBatchFailed(batchId: string, errorMessage: string): Promise<void> {
    const [batch] = await this.database
      .update(importBatches)
      .set({
        status: 'FAILED',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(importBatches.id, batchId))
      .returning({
        importJobId: importBatches.importJobId,
        batchIndex: importBatches.batchIndex,
        rowCount: importBatches.rowCount,
        retryCount: importBatches.retryCount,
      });

    if (!batch) return;

    await this.recordEvent({
      importId: batch.importJobId,
      eventType: 'IMPORT_BATCH_FAILED',
      message: `Batch ${batch.batchIndex + 1} failed.`,
      metadata: {
        batchId,
        batchIndex: batch.batchIndex,
        rowCount: batch.rowCount,
        retryCount: batch.retryCount,
        errorMessage: truncateErrorMessage(errorMessage),
      },
      visibleToUser: true,
    });
  }

  public async persistBatchResult(
    input: PersistBatchResultInput
  ): Promise<PersistBatchResultSummary> {
    return this.database.transaction(async (tx) => {
      const rowsByIndex = new Map(input.rows.map((row) => [row.rowIndex, row]));

      const recordsToInsert = input.records
        .map((record) => {
          const row = rowsByIndex.get(record.rowIndex);
          if (!row) return null;

          return {
            importJobId: input.importId,
            importRowId: row.id,
            rowIndex: record.rowIndex,
            ...mapCrmRecordToDb(record.record),
          };
        })
        .filter((value) => value !== null);

      const skippedToInsert = input.skippedRecords
        .map((skipped) => {
          const row = rowsByIndex.get(skipped.rowIndex);
          if (!row) return null;

          return {
            importJobId: input.importId,
            importRowId: row.id,
            rowIndex: skipped.rowIndex,
            reason: skipped.reason,
            rawData: row.rawData,
          };
        })
        .filter((value) => value !== null);

      if (recordsToInsert.length > 0) {
        await tx.insert(crmImportRecords).values(recordsToInsert);
      }

      if (skippedToInsert.length > 0) {
        await tx.insert(crmSkippedRecords).values(skippedToInsert);
      }

      await tx
        .update(importJobs)
        .set({
          processedRows: sqlAdd(importJobs.processedRows, input.rows.length),
          importedCount: sqlAdd(importJobs.importedCount, recordsToInsert.length),
          skippedCount: sqlAdd(importJobs.skippedCount, skippedToInsert.length),
          updatedAt: new Date(),
        })
        .where(eq(importJobs.id, input.importId));

      await tx.insert(importEvents).values({
        importJobId: input.importId,
        eventType: 'IMPORT_BATCH_RESULT_PERSISTED',
        message: 'Batch result persisted.',
        metadata: {
          processedRows: input.rows.length,
          importedRows: recordsToInsert.length,
          skippedRows: skippedToInsert.length,
        },
        visibleToUser: false,
      });

      return {
        processedRows: input.rows.length,
        importedCount: recordsToInsert.length,
        skippedCount: skippedToInsert.length,
      };
    });
  }

  public async completeJobIfFinished(importId: string): Promise<void> {
    const job = await this.getJobSummary(importId);
    if (!job) return;

    const [batchTotals] = await this.database
      .select({
        total: count(),
      })
      .from(importBatches)
      .where(eq(importBatches.importJobId, importId));

    const [completedTotals] = await this.database
      .select({
        total: count(),
      })
      .from(importBatches)
      .where(and(eq(importBatches.importJobId, importId), eq(importBatches.status, 'COMPLETED')));

    const totalBatchCount = batchTotals?.total ?? 0;
    const completedBatchCount = completedTotals?.total ?? 0;
    const allRowsAlreadyProcessed = job.totalRows > 0 && job.processedRows >= job.totalRows;

    if (
      (totalBatchCount === 0 && allRowsAlreadyProcessed) ||
      (totalBatchCount > 0 && totalBatchCount === completedBatchCount)
    ) {
      await this.database
        .update(importJobs)
        .set({
          status: 'COMPLETED',
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(importJobs.id, importId));

      await this.recordEvent({
        importId,
        eventType: 'IMPORT_COMPLETED',
        message: 'Import completed.',
        metadata: {
          totalRows: job.totalRows,
          processedRows: job.processedRows,
          importedRows: job.importedCount,
          skippedRows: job.skippedCount,
          totalBatches: totalBatchCount,
        },
        visibleToUser: true,
      });
    }
  }

  private async getSkippedRowIndexes(importId: string): Promise<Set<number>> {
    const skippedRows = await this.database
      .select({
        rowIndex: crmSkippedRecords.rowIndex,
      })
      .from(crmSkippedRecords)
      .where(eq(crmSkippedRecords.importJobId, importId));

    return new Set(skippedRows.map((row) => row.rowIndex));
  }

  private async getImportBatches(importId: string): Promise<Array<typeof importBatches.$inferSelect>> {
    return this.database
      .select()
      .from(importBatches)
      .where(eq(importBatches.importJobId, importId))
      .orderBy(asc(importBatches.batchIndex));
  }

  private async getBatchStatusCounts(importId: string): Promise<BatchStatusCounts> {
    const batches = await this.getImportBatches(importId);
    return countBatchesByStatus(batches);
  }

  private async getSkippedReasonCounts(importId: string): Promise<Record<string, number>> {
    const rows = await this.database
      .select({
        reason: crmSkippedRecords.reason,
        total: count(),
      })
      .from(crmSkippedRecords)
      .where(eq(crmSkippedRecords.importJobId, importId))
      .groupBy(crmSkippedRecords.reason);

    return Object.fromEntries(rows.map((row) => [row.reason, row.total]));
  }

  private async getRecentEvents(
    importId: string,
    limit: number,
    visibleOnly: boolean
  ): Promise<ImportEventSummary[]> {
    const events = await this.database
      .select()
      .from(importEvents)
      .where(
        and(
          eq(importEvents.importJobId, importId),
          visibleOnly ? eq(importEvents.visibleToUser, true) : undefined
        )
      )
      .orderBy(desc(importEvents.createdAt))
      .limit(limit);

    return events.map(mapImportEventSummary);
  }

  private async recordEvent(input: {
    importId: string;
    eventType: string;
    message: string;
    metadata?: Record<string, unknown> | null;
    visibleToUser?: boolean;
  }): Promise<void> {
    await this.database.insert(importEvents).values({
      importJobId: input.importId,
      eventType: input.eventType,
      message: input.message,
      metadata: input.metadata ?? undefined,
      visibleToUser: input.visibleToUser ?? false,
    });
  }

  public async failJob(importId: string, errorMessage: string): Promise<void> {
    await this.database
      .update(importJobs)
      .set({
        status: 'FAILED',
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(importJobs.id, importId));

    await this.recordEvent({
      importId,
      eventType: 'IMPORT_FAILED',
      message: 'Import failed.',
      metadata: {
        errorMessage: truncateErrorMessage(errorMessage),
      },
      visibleToUser: true,
    });
  }

  public async cancelJob(importId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx
        .update(importJobs)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(importJobs.id, importId));

      await tx
        .update(importBatches)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(importBatches.importJobId, importId),
            inArray(importBatches.status, ['PENDING', 'PROCESSING', 'FAILED'] as const)
          )
        );
    });

    await this.recordEvent({
      importId,
      eventType: 'IMPORT_CANCELLED',
      message: 'Import cancelled.',
      metadata: null,
      visibleToUser: true,
    });
  }

  public async getStatus(importId: string): Promise<ImportStatusResult | null> {
    const job = await this.getJobSummary(importId);
    if (!job) return null;

    const batchCounts = await this.getBatchStatusCounts(importId);

    return {
      importId: job.id,
      status: job.status,
      progress: {
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        totalBatches: job.totalBatches,
        completedBatches: batchCounts.COMPLETED,
        failedBatches: batchCounts.FAILED,
        percent:
          job.totalRows > 0
            ? Math.min(100, Math.round((job.processedRows / job.totalRows) * 100))
            : 0,
      },
      totals: {
        imported: job.importedCount,
        skipped: job.skippedCount,
      },
      error: job.errorMessage,
      recentEvents: await this.getRecentEvents(importId, 10, true),
    };
  }

  public async getResult(input: GetImportResultInput): Promise<ImportResult | null> {
    const job = await this.getJobSummary(input.importId);
    if (!job) return null;

    const records = await this.database
      .select()
      .from(crmImportRecords)
      .where(
        and(
          eq(crmImportRecords.importJobId, input.importId),
          input.cursor ? gt(crmImportRecords.rowIndex, input.cursor) : undefined
        )
      )
      .orderBy(asc(crmImportRecords.rowIndex))
      .limit(input.limit + 1);

    const hasMore = records.length > input.limit;
    const pageRecords = hasMore ? records.slice(0, input.limit) : records;
    const nextCursor = hasMore ? pageRecords.at(-1)?.rowIndex ?? null : null;

    const skippedRecords = input.includeSkipped
      ? await this.database
          .select()
          .from(crmSkippedRecords)
          .where(eq(crmSkippedRecords.importJobId, input.importId))
          .orderBy(asc(crmSkippedRecords.rowIndex))
      : [];
    const batches = await this.getImportBatches(input.importId);
    const batchCounts = countBatchesByStatus(batches);
    const skippedReasonCounts = await this.getSkippedReasonCounts(input.importId);
    const processedRows = job.processedRows;
    const unprocessedRows = Math.max(0, job.totalRows - processedRows);

    return {
      importId: job.id,
      status: job.status,
      summary: {
        totalRows: job.totalRows,
        totalImported: job.importedCount,
        totalSkipped: job.skippedCount,
        totalBatches: batches.length,
        completedBatches: batchCounts.COMPLETED,
        failedBatches: batchCounts.FAILED,
        pendingBatches: batchCounts.PENDING,
        processingBatches: batchCounts.PROCESSING,
        processedRows,
        unprocessedRows,
      },
      batches: batches.map(mapBatchResultSummary),
      skippedReasonCounts,
      events: await this.getRecentEvents(input.importId, 25, true),
      records: pageRecords.map((record) => ({
        rowIndex: record.rowIndex,
        record: mapDbToCrmRecord(record),
      })),
      skippedRecords: skippedRecords.map((record) => ({
        rowIndex: record.rowIndex,
        reason: record.reason,
        rawData: record.rawData,
      })),
      pageInfo: {
        nextCursor,
        hasMore,
      },
    };
  }

  public async updateImportedRecord(importId: string, rowIndex: number, record: Partial<CrmRecord>): Promise<void> {
    const updateData: Record<string, any> = {};
    if (record.created_at !== undefined) updateData.createdAtValue = record.created_at;
    if (record.name !== undefined) updateData.name = record.name;
    if (record.email !== undefined) updateData.email = record.email;
    if (record.country_code !== undefined) updateData.countryCode = record.country_code;
    if (record.mobile_without_country_code !== undefined) updateData.mobileWithoutCountryCode = record.mobile_without_country_code;
    if (record.company !== undefined) updateData.company = record.company;
    if (record.city !== undefined) updateData.city = record.city;
    if (record.state !== undefined) updateData.state = record.state;
    if (record.country !== undefined) updateData.country = record.country;
    if (record.lead_owner !== undefined) updateData.leadOwner = record.lead_owner;
    if (record.crm_status !== undefined) updateData.crmStatus = record.crm_status;
    if (record.crm_note !== undefined) updateData.crmNote = record.crm_note;
    if (record.data_source !== undefined) updateData.dataSource = record.data_source;
    if (record.possession_time !== undefined) updateData.possessionTime = record.possession_time;
    if (record.description !== undefined) updateData.description = record.description;

    if (Object.keys(updateData).length === 0) return;

    await this.database
      .update(crmImportRecords)
      .set(updateData)
      .where(
        and(
          eq(crmImportRecords.importJobId, importId),
          eq(crmImportRecords.rowIndex, rowIndex)
        )
      );
  }

  public async getSkippedRecord(importId: string, rowIndex: number): Promise<{ rowIndex: number; reason: string; rawData: Record<string, string>; importRowId: string } | null> {
    const [record] = await this.database
      .select()
      .from(crmSkippedRecords)
      .where(
        and(
          eq(crmSkippedRecords.importJobId, importId),
          eq(crmSkippedRecords.rowIndex, rowIndex)
        )
      )
      .limit(1);

    if (!record) return null;

    return {
      rowIndex: record.rowIndex,
      reason: record.reason,
      rawData: record.rawData,
      importRowId: record.importRowId,
    };
  }

  public async reimportSkippedRecord(importId: string, importRowId: string, rowIndex: number, record: CrmRecord): Promise<void> {
    await this.database.transaction(async (tx) => {
      // 1. Insert into crmImportRecords
      await tx.insert(crmImportRecords).values({
        importJobId: importId,
        importRowId,
        rowIndex,
        ...mapCrmRecordToDb(record),
      });

      // 2. Delete from crmSkippedRecords
      await tx
        .delete(crmSkippedRecords)
        .where(
          and(
            eq(crmSkippedRecords.importJobId, importId),
            eq(crmSkippedRecords.rowIndex, rowIndex)
          )
        );

      // 3. Update importJobs counts
      await tx
        .update(importJobs)
        .set({
          importedCount: sqlAdd(importJobs.importedCount, 1),
          skippedCount: sql<number>`GREATEST(${importJobs.skippedCount} - 1, 0)`,
          updatedAt: new Date(),
        })
        .where(eq(importJobs.id, importId));
    });
  }

  public async getHistory(limit: number, cursor?: number): Promise<{ jobs: ImportJobSummary[]; nextCursor: number | null; hasMore: boolean }> {
    const offset = cursor ?? 0;
    const items = await this.database
      .select()
      .from(importJobs)
      .orderBy(desc(importJobs.createdAt))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = items.length > limit;
    const jobsToReturn = hasMore ? items.slice(0, limit) : items;

    return {
      jobs: jobsToReturn.map(mapJobSummary),
      nextCursor: hasMore ? offset + limit : null,
      hasMore,
    };
  }
}

function mapJobSummary(job: typeof importJobs.$inferSelect): ImportJobSummary {
  return {
    id: job.id,
    status: job.status,
    headers: job.headers,
    totalRows: job.totalRows,
    totalBatches: job.totalBatches,
    processedRows: job.processedRows,
    importedCount: job.importedCount,
    skippedCount: job.skippedCount,
    errorMessage: job.errorMessage,
    createdAt: job.createdAt,
  };
}

function mapBatchSummary(batch: typeof importBatches.$inferSelect): ImportBatchSummary {
  return {
    id: batch.id,
    batchIndex: batch.batchIndex,
    status: batch.status,
    rowStartIndex: batch.rowStartIndex,
    rowEndIndex: batch.rowEndIndex,
    rowCount: batch.rowCount,
    retryCount: batch.retryCount,
  };
}

function mapBatchResultSummary(batch: typeof importBatches.$inferSelect): ImportResultBatchSummary {
  return {
    ...mapBatchSummary(batch),
    errorMessage: batch.errorMessage,
  };
}

function mapImportEventSummary(event: typeof importEvents.$inferSelect): ImportEventSummary {
  return {
    eventType: event.eventType,
    message: event.message,
    metadata: event.metadata ?? null,
    visibleToUser: event.visibleToUser,
    createdAt: event.createdAt,
  };
}

function countBatchesByStatus(batches: Array<typeof importBatches.$inferSelect>): BatchStatusCounts {
  const counts: BatchStatusCounts = {
    PENDING: 0,
    PROCESSING: 0,
    COMPLETED: 0,
    FAILED: 0,
    CANCELLED: 0,
  };

  for (const batch of batches) {
    counts[batch.status] += 1;
  }

  return counts;
}

function truncateErrorMessage(errorMessage: string): string {
  return errorMessage.length > ERROR_MESSAGE_MAX_LENGTH
    ? `${errorMessage.slice(0, ERROR_MESSAGE_MAX_LENGTH)}...`
    : errorMessage;
}

function mapCrmRecordToDb(record: CrmRecord) {
  return {
    createdAtValue: record.created_at,
    name: record.name,
    email: record.email,
    countryCode: record.country_code,
    mobileWithoutCountryCode: record.mobile_without_country_code,
    company: record.company,
    city: record.city,
    state: record.state,
    country: record.country,
    leadOwner: record.lead_owner,
    crmStatus: record.crm_status,
    crmNote: record.crm_note,
    dataSource: record.data_source,
    possessionTime: record.possession_time,
    description: record.description,
    confidence: record.confidence,
  };
}

function mapDbToCrmRecord(record: typeof crmImportRecords.$inferSelect): CrmRecord {
  return {
    created_at: record.createdAtValue,
    name: record.name,
    email: record.email,
    country_code: record.countryCode,
    mobile_without_country_code: record.mobileWithoutCountryCode,
    company: record.company,
    city: record.city,
    state: record.state,
    country: record.country,
    lead_owner: record.leadOwner,
    crm_status: record.crmStatus,
    crm_note: record.crmNote,
    data_source: record.dataSource,
    possession_time: record.possessionTime,
    description: record.description,
    confidence: record.confidence,
  };
}

function sqlAdd(column: AnyPgColumn, value: number) {
  return sql<number>`${column} + ${value}`;
}
