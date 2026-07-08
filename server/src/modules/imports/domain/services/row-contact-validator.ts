const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE_PATTERN = /(?:\+?\d[\d\s().-]{7,}\d)/g;

export interface ContactExtractionResult {
  emails: string[];
  phones: string[];
  hasContact: boolean;
}

export function extractContactsFromRawRow(rawData: Record<string, string>): ContactExtractionResult {
  const text = Object.values(rawData).join(' ');
  const emails = unique((text.match(EMAIL_PATTERN) ?? []).map((value) => value.trim().toLowerCase()));
  const phones = unique((text.match(PHONE_PATTERN) ?? []).map(cleanPhoneLikeValue).filter(Boolean));

  return {
    emails,
    phones,
    hasContact: emails.length > 0 || phones.length > 0,
  };
}

export function shouldSkipRawRow(rawData: Record<string, string>): boolean {
  return !extractContactsFromRawRow(rawData).hasContact;
}

function cleanPhoneLikeValue(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
