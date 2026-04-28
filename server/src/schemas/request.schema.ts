import { z } from "zod";

export const createServiceRequestSchema = z.object({
  propertyId: z.string().min(1, "Invalid property ID"),
  requestType: z.enum(
    ["pet_request", "alteration_request", "general_enquiry"],
    {
      required_error: "Please select a request type",
    },
  ),
  notes: z.string().min(10, "Please provide at least 10 characters"),
});

export const updateServiceRequestSchema = z.object({
  status: z.enum(["submitted", "in_review", "resolved"], {
    required_error: "Please select a status",
  }),
});

export const updateUserSchema = z.object({
  is_active: z.boolean(),
});
