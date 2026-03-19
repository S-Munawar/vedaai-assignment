import { z } from 'zod';

export const schoolIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid school id');
export const schoolNameSchema = z.string().trim().min(1, 'School name is required').max(120);

export const schoolSchema = z.object({
  id: schoolIdSchema,
  name: schoolNameSchema,
});

export const listSchoolsResponseSchema = z.object({
  success: z.literal(true),
  schools: z.array(schoolSchema),
});

export const createSchoolRequestSchema = z.object({
  name: schoolNameSchema,
});

export const createSchoolResponseSchema = z.object({
  success: z.literal(true),
  school: schoolSchema,
});

export const schoolsErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.string(),
});

export type School = z.infer<typeof schoolSchema>;
export type ListSchoolsResponse = z.infer<typeof listSchoolsResponseSchema>;
export type CreateSchoolRequest = z.infer<typeof createSchoolRequestSchema>;
export type CreateSchoolResponse = z.infer<typeof createSchoolResponseSchema>;
export type SchoolsErrorResponse = z.infer<typeof schoolsErrorResponseSchema>;
