import { z } from 'zod';

export const schoolIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid school id');
export const schoolNameSchema = z.string().trim().min(1, 'School name is required').max(120);

export const schoolBoardOptions = [
  'CBSE',
  'ICSE',
  'State Board',
  'IB',
  'Cambridge',
  'Other',
] as const;

export const schoolMediumOptions = [
  'English',
  'Hindi',
  'Regional',
  'Bilingual',
  'Other',
] as const;

export const schoolTypeOptions = [
  'Public',
  'Private',
  'Government',
  'International',
  'Other',
] as const;

export const schoolBoardSchema = z.enum(schoolBoardOptions);
export const schoolMediumSchema = z.enum(schoolMediumOptions);
export const schoolTypeSchema = z.enum(schoolTypeOptions);

export const schoolLocationSchema = z.object({
  addressLine: z.string().trim().max(200).default(''),
  city: z.string().trim().max(80).default(''),
  state: z.string().trim().max(80).default(''),
  country: z.string().trim().max(80).default(''),
  postalCode: z.string().trim().max(20).default(''),
});

export const schoolSchema = z.object({
  id: schoolIdSchema,
  name: schoolNameSchema,
  board: schoolBoardSchema,
  medium: schoolMediumSchema,
  schoolType: schoolTypeSchema,
  location: schoolLocationSchema,
  contactEmail: z.string().trim().email('Contact email must be valid').or(z.literal('')).default(''),
  contactPhone: z.string().trim().max(30).default(''),
  website: z.string().trim().url('Website must be a valid URL').or(z.literal('')).default(''),
  principalName: z.string().trim().max(120).default(''),
  establishedYear: z.number().int().min(1800).max(2100).nullable().default(null),
  description: z.string().trim().max(1000).default(''),
  isActive: z.boolean().default(true),
});

export const listSchoolsResponseSchema = z.object({
  success: z.literal(true),
  schools: z.array(schoolSchema),
});

export const createSchoolRequestSchema = z.object({
  name: schoolNameSchema,
  board: schoolBoardSchema,
  medium: schoolMediumSchema,
  schoolType: schoolTypeSchema,
  location: schoolLocationSchema,
  contactEmail: z.string().trim().email('Contact email must be valid').or(z.literal('')).default(''),
  contactPhone: z.string().trim().max(30).default(''),
  website: z.string().trim().url('Website must be a valid URL').or(z.literal('')).default(''),
  principalName: z.string().trim().max(120).default(''),
  establishedYear: z.number().int().min(1800).max(2100).nullable().default(null),
  description: z.string().trim().max(1000).default(''),
  isActive: z.boolean().default(true),
});

export const createSchoolResponseSchema = z.object({
  success: z.literal(true),
  school: schoolSchema,
});

export const schoolDetailsResponseSchema = z.object({
  success: z.literal(true),
  school: schoolSchema,
});

export const schoolsErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.string(),
});

export type School = z.infer<typeof schoolSchema>;
export type SchoolBoard = z.infer<typeof schoolBoardSchema>;
export type SchoolMedium = z.infer<typeof schoolMediumSchema>;
export type SchoolType = z.infer<typeof schoolTypeSchema>;
export type SchoolLocation = z.infer<typeof schoolLocationSchema>;
export type ListSchoolsResponse = z.infer<typeof listSchoolsResponseSchema>;
export type CreateSchoolRequest = z.infer<typeof createSchoolRequestSchema>;
export type CreateSchoolResponse = z.infer<typeof createSchoolResponseSchema>;
export type SchoolDetailsResponse = z.infer<typeof schoolDetailsResponseSchema>;
export type SchoolsErrorResponse = z.infer<typeof schoolsErrorResponseSchema>;
