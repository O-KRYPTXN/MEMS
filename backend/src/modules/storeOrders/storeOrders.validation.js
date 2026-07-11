import { z } from 'zod';

export const createStoreOrderSchema = z.object({
  supplierName: z.string().optional(),
  supplierEmail: z.string().email('Invalid supplier email').optional().or(z.literal('')),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      partId: z.string().min(1, 'Part ID is required'),
      qty: z.number().int().positive('Quantity must be positive'),
      unitPrice: z.number().nonnegative('Unit price must be non-negative')
    })
  ).min(1, 'Order must contain at least one item')
});

export const updateStoreOrderStatusSchema = z.object({
  status: z.enum(['ORDERED', 'DELIVERED', 'REJECTED']),
  rejectionReason: z.string().optional()
});

export const updateSupplierResponseSchema = z.object({
  supplierResponse: z.string()
});
