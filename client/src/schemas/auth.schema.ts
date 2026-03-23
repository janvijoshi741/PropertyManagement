import { z } from 'zod';

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// auth.schema.ts
export const otpSchema = z.object({
  code: z.string().min(6).max(6),
});
export const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type EmailFormData = z.infer<typeof emailSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
