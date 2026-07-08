import { describe, expect, it } from 'vitest';
import { CsvParseAdapter } from '../../../src/modules/imports/infrastructure/csv/csv-parse-adapter.js';

describe('CsvParseAdapter', () => {
  it('parses a CSV buffer into headers and import rows', async () => {
    const parser = new CsvParseAdapter();
    const result = await parser.parse({
      buffer: Buffer.from('Name,Email\nJohn,john@example.com\nSarah,sarah@example.com'),
      maxRows: 10,
      maxRecordSizeBytes: 1024,
    });

    expect(result.headers).toEqual(['Name', 'Email']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]?.rawData).toEqual({
      Name: 'John',
      Email: 'john@example.com',
    });
    expect(result.rows[0]?.rawTextHash).toEqual(expect.any(String));
  });

  it('normalizes BOM, repeated header whitespace, duplicate headers, and blank lines', async () => {
    const parser = new CsvParseAdapter();
    const result = await parser.parse({
      buffer: Buffer.from('\uFEFFFull   Name,Email,Email\n\nJohn,john@example.com,john.backup@example.com'),
      maxRows: 10,
      maxRecordSizeBytes: 1024,
    });

    expect(result.headers).toEqual(['Full Name', 'Email', 'Email_2']);
    expect(result.emptyRowCount).toBe(1);
    expect(result.rows[0]?.rawData).toEqual({
      'Full Name': 'John',
      Email: 'john@example.com',
      Email_2: 'john.backup@example.com',
    });
  });

  it('rejects header-only CSV files', async () => {
    const parser = new CsvParseAdapter();

    await expect(
      parser.parse({
        buffer: Buffer.from('Name,Email\n'),
        maxRows: 10,
        maxRecordSizeBytes: 1024,
      })
    ).rejects.toThrow('CSV must contain a header row and at least one data row.');
  });

  it('rejects CSV files that exceed the configured row limit', async () => {
    const parser = new CsvParseAdapter();

    await expect(
      parser.parse({
        buffer: Buffer.from('Name,Email\nA,a@example.com\nB,b@example.com'),
        maxRows: 1,
        maxRecordSizeBytes: 1024,
      })
    ).rejects.toThrow('CSV row limit exceeded.');
  });
});
