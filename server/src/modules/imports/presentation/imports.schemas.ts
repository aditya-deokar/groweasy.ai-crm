import { z } from 'zod';

export const importIdParamsSchema = z.object({
  importId: z.string().uuid(),
});

export const importResultQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  cursor: z.coerce.number().int().positive().optional(),
  includeSkipped: z.coerce.boolean().default(true),
});

export type ImportIdParams = z.infer<typeof importIdParamsSchema>;
export type ImportResultQuery = z.infer<typeof importResultQuerySchema>;
