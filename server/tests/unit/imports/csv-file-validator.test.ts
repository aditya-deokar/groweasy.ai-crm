import { describe, expect, it } from 'vitest';
import type { Env } from '../../../src/config/env.js';
import { CsvFileValidator } from '../../../src/modules/imports/infrastructure/csv/csv-file-validator.js';

const validator = new CsvFileValidator({
  uploadMaxFileSizeBytes: 10,
} as Env);

describe('CsvFileValidator', () => {
  it('accepts a non-empty CSV file with a known CSV MIME type', () => {
    const file = validator.validate({
      originalName: 'leads.csv',
      mimeType: 'text/csv',
      sizeBytes: 9,
      buffer: Buffer.from('Name\nJohn'),
    });

    expect(file.originalName).toBe('leads.csv');
  });

  it('accepts octet-stream uploads when the file extension is CSV', () => {
    const file = validator.validate({
      originalName: 'leads.csv',
      mimeType: 'application/octet-stream',
      sizeBytes: 9,
      buffer: Buffer.from('Name\nJohn'),
    });

    expect(file.mimeType).toBe('application/octet-stream');
  });

  it('rejects empty files before parsing', () => {
    expect(() =>
      validator.validate({
        originalName: 'empty.csv',
        mimeType: 'text/csv',
        sizeBytes: 0,
        buffer: Buffer.alloc(0),
      })
    ).toThrow('CSV file is empty.');

    try {
      validator.validate({
        originalName: 'empty.csv',
        mimeType: 'text/csv',
        sizeBytes: 0,
        buffer: Buffer.alloc(0),
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: 'CSV_FILE_EMPTY',
      });
    }
  });

  it('rejects files above the configured upload limit', () => {
    expect(() =>
      validator.validate({
        originalName: 'large.csv',
        mimeType: 'text/csv',
        sizeBytes: 11,
        buffer: Buffer.alloc(11),
      })
    ).toThrow('File is too large.');
  });

  it('rejects non-CSV extensions even when the MIME type is text-like', () => {
    expect(() =>
      validator.validate({
        originalName: 'leads.txt',
        mimeType: 'text/plain',
        sizeBytes: 9,
        buffer: Buffer.from('Name\nJohn'),
      })
    ).toThrow('Unsupported file type.');
  });
});
