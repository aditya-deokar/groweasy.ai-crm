import { describe, expect, it } from 'vitest';
import {
  extractContactsFromRawRow,
  shouldSkipRawRow,
} from '../../../src/modules/imports/domain/services/row-contact-validator.js';

describe('row contact validator', () => {
  it('detects emails and phone numbers from arbitrary raw row values', () => {
    const result = extractContactsFromRawRow({
      person: 'John Doe',
      contact: 'john@example.com / +91 98765 43210',
      notes: 'backup john.backup@example.com',
    });

    expect(result.hasContact).toBe(true);
    expect(result.emails).toEqual(['john@example.com', 'john.backup@example.com']);
    expect(result.phones).toEqual(['+919876543210']);
  });

  it('skips rows with no email and no phone', () => {
    expect(
      shouldSkipRawRow({
        name: 'No Contact',
        notes: 'Only a name was provided',
      })
    ).toBe(true);
  });
});
