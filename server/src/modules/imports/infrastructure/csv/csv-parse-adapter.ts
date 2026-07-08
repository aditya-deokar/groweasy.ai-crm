import { createHash } from 'node:crypto';
import { parse } from 'csv-parse/sync';
import {
  ImportRowLimitExceededError,
  InvalidCsvError,
} from '../../domain/errors/import-errors.js';
import type {
  CsvParser,
  ParseCsvInput,
  ParseCsvResult,
} from '../../domain/ports/csv-parser.port.js';
import type { ImportRow } from '../../domain/entities/import-row.js';

type CsvRecord = Record<string, unknown>;

export class CsvParseAdapter implements CsvParser {
  public async parse(input: ParseCsvInput): Promise<ParseCsvResult> {
    try {
      let headers: string[] = [];
      const blankDataLineCount = countBlankDataLines(input.buffer);

      const records = parse(input.buffer, {
        bom: true,
        columns(rawHeaders: string[]) {
          headers = normalizeHeaders(rawHeaders);
          return headers;
        },
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
        relax_quotes: true,
        max_record_size: input.maxRecordSizeBytes,
      }) as CsvRecord[];

      if (records.length > input.maxRows) {
        throw new ImportRowLimitExceededError(input.maxRows);
      }

      if (headers.length === 0 || records.length === 0) {
        throw new InvalidCsvError('CSV must contain a header row and at least one data row.');
      }

      const rows = records.map((record, index) => this.mapRecordToImportRow(record, index + 1));

      return {
        headers,
        rows,
        emptyRowCount: blankDataLineCount,
        warningCount: rows.reduce((total, row) => total + (row.parseWarnings?.length ?? 0), 0),
      };
    } catch (error) {
      if (error instanceof ImportRowLimitExceededError || error instanceof InvalidCsvError) {
        throw error;
      }

      throw new InvalidCsvError('CSV parsing failed.', getCsvErrorDetails(error));
    }
  }

  private mapRecordToImportRow(record: CsvRecord, rowIndex: number): ImportRow {
    const rawData = Object.fromEntries(
      Object.entries(record).map(([key, value]) => [key, normalizeCsvCell(value)])
    );
    const rawTextHash = createHash('sha256').update(JSON.stringify(rawData)).digest('hex');

    return {
      rowIndex,
      rawData,
      rawTextHash,
    };
  }
}

function normalizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function normalizeHeaders(rawHeaders: string[]): string[] {
  const seenHeaders = new Map<string, number>();

  return rawHeaders.map((header, index) => {
    const baseHeader = String(header).replace(/\s+/g, ' ').trim() || `column_${index + 1}`;
    const seenCount = seenHeaders.get(baseHeader) ?? 0;
    seenHeaders.set(baseHeader, seenCount + 1);

    if (seenCount === 0) {
      return baseHeader;
    }

    return `${baseHeader}_${seenCount + 1}`;
  });
}

function countBlankDataLines(buffer: Buffer): number {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r\n|\n|\r/);
  if (lines.at(-1)?.trim().length === 0) {
    lines.pop();
  }

  return lines.slice(1).filter((line) => line.trim().length === 0).length;
}

function getCsvErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
    };
  }

  return {
    message: 'Unknown CSV parsing error.',
  };
}
