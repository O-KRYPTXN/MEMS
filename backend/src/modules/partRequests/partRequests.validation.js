import { z } from 'zod';

export const createPartRequestSchema = z.object({
  partId: z.string().min(1, 'Part ID is required'),
  qty: z.number().int().min(1, 'Quantity must be at least 1'),
  workOrderId: z.string().optional(),
  notes: z.string().optional()
});

export const updatePartRequestStatusSchema = z.object({
  status: z.enum(['APPROVED', 'FULFILLED', 'REJECTED']),
  notes: z.string().optional()
});

export const queryPartRequestsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(1000).optional().default(100),
  status: z.enum(['PENDING', 'APPROVED', 'FULFILLED', 'REJECTED']).optional(),
  partId: z.string().optional(),
  workOrderId: z.string().optional()
});
