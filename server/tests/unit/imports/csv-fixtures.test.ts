import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CsvParseAdapter } from '../../../src/modules/imports/infrastructure/csv/csv-parse-adapter.js';

const fixtureDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../fixtures/csv'
);

const fixtureNames = [
  'facebook-leads.csv',
  'google-ads.csv',
  'real-estate-crm.csv',
  'manual-messy.csv',
  'multiple-contacts.csv',
  'invalid-no-contact.csv',
];

describe('CSV fixtures', () => {
  it.each(fixtureNames)('parses %s', async (fixtureName) => {
    const parser = new CsvParseAdapter();
    const buffer = await readFile(path.join(fixtureDir, fixtureName));

    const result = await parser.parse({
      buffer,
      maxRows: 100,
      maxRecordSizeBytes: 1024 * 1024,
    });

    expect(result.headers.length).toBeGreaterThan(0);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.rows[0]?.rowIndex).toBe(1);
  });
});
