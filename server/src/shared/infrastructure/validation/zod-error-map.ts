import type { ZodError, ZodIssue } from 'zod';

export interface FormattedValidationIssue {
  path: string;
  code: string;
  message: string;
}

export function formatZodIssue(issue: ZodIssue): FormattedValidationIssue {
  return {
    path: issue.path.length > 0 ? issue.path.join('.') : 'root',
    code: issue.code,
    message: issue.message,
  };
}

export function formatZodError(error: ZodError): FormattedValidationIssue[] {
  return error.issues.map(formatZodIssue);
}
