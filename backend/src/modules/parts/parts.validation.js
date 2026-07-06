import { z } from 'zod';

const PartUnitEnum = z.enum(['PCS', 'BOX', 'SET', 'KG', 'PAIR']);

export const createPartSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  category: z.string().min(2, 'Category is required'),
  unit: PartUnitEnum.default('PCS'),
  qty: z.number().int().min(0).default(0),
  minLevel: z.number().int().min(0).default(5),
  location: z.string().optional(),
  unitPrice: z.number().min(0).default(0),
  isRecent: z.boolean().optional()
});

export const updatePartSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  category: z.string().min(2, 'Category is required').optional(),
  unit: PartUnitEnum.optional(),
  qty: z.number().int().min(0).optional(),
  minLevel: z.number().int().min(0).optional(),
  location: z.string().optional(),
  unitPrice: z.number().min(0).optional(),
  isRecent: z.boolean().optional()
});

export const queryPartsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(10),
  category: z.string().optional(),
  search: z.string().optional(),
  isLowStock: z.enum(['true', 'false']).optional()
});
