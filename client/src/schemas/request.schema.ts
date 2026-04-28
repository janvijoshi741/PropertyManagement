import { z } from 'zod';

export const newRequestSchema = z.object({
  propertyId: z.string().min(1, 'Please select a property'),
  requestType: z.enum(['pet_request', 'alteration_request', 'general_enquiry'], {
    error: 'Please select a request type',
  }),
  notes: z.string().min(10, 'Please provide at least 10 characters'),
});

export type NewRequestFormData = z.infer<typeof newRequestSchema>;
