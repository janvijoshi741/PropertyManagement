import { z } from 'zod';

export const importRowSchema = z.object({
  external_ref: z.string().min(1, 'External reference is required'),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().optional().default(''),
  city: z.string().min(1, 'City is required'),
  postcode: z.string().min(1, 'Postcode is required'),
  property_type: z.string().min(1, 'Property type is required'),
  customer_email: z.string().email('Invalid email').optional(),
  invoice_number: z.string().optional(),
  invoice_amount: z.union([z.string(), z.number()]).optional(),
  invoice_status: z.enum(['unpaid', 'paid', 'overdue']).optional(),
  invoice_issue_date: z.string().optional(),
  invoice_due_date: z.string().optional(),
});

export type ImportRowData = z.infer<typeof importRowSchema>;
