import { z } from 'zod';

export const importIdParamsSchema = z.object({
  importId: z.string().uuid(),
});

export const importRowParamsSchema = z.object({
  importId: z.string().uuid(),
  rowIndex: z.coerce.number().int().min(1),
});

export const importResultQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.coerce.number().int().positive().optional(),
  includeSkipped: z.coerce.boolean().default(true),
});

export const importHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.coerce.number().int().nonnegative().optional(),
});

export type ImportIdParams = z.infer<typeof importIdParamsSchema>;
export type ImportRowParams = z.infer<typeof importRowParamsSchema>;
export type ImportResultQuery = z.infer<typeof importResultQuerySchema>;
export type ImportHistoryQuery = z.infer<typeof importHistoryQuerySchema>;
