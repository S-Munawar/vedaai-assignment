import { z } from 'zod';

export const ALLOWED_SCHOOLS = ['Delhi Public Schoool'] as const;

export const schoolNameSchema = z.string().trim().min(1, 'School name is required').max(120);
export const authProviderSchema = z.enum(['credentials', 'google']);

export const registerRequestSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  schoolName: schoolNameSchema,
});

export const loginRequestSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  schoolName: schoolNameSchema,
});

export const googleAuthRequestSchema = z.object({
  idToken: z.string().trim().min(1, 'idToken is required'),
  schoolName: schoolNameSchema,
});

export const authUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().optional(),
  schoolId: z.string(),
  schoolName: schoolNameSchema,
  provider: authProviderSchema,
});

export const authSuccessResponseSchema = z.object({
  success: z.literal(true),
  user: authUserSchema,
});

export const authErrorResponseSchema = z.object({
  error: z.string(),
});

export const authLogoutSuccessResponseSchema = z.object({
  success: z.literal(true),
});

export const authLogoutErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.string(),
});

export const authTokenPayloadSchema = z.object({
  sub: z.string(),
  username: z.string().optional(),
  email: z.string().optional(),
  schoolId: z.string(),
  schoolName: schoolNameSchema,
  provider: authProviderSchema,
});

export const authMeResponseSchema = z.union([
  z.object({ authenticated: z.literal(false) }),
  z.object({ authenticated: z.literal(true), user: authTokenPayloadSchema }),
]);

export const pendingGoogleRegistrationSchema = z.object({
  idToken: z.string().min(1, 'idToken is required'),
  email: z.string(),
  username: z.string().min(1, 'Username is required'),
});

export type SchoolName = z.infer<typeof schoolNameSchema>;
export type AuthProvider = z.infer<typeof authProviderSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type GoogleAuthRequest = z.infer<typeof googleAuthRequestSchema>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthSuccessResponse = z.infer<typeof authSuccessResponseSchema>;
export type AuthErrorResponse = z.infer<typeof authErrorResponseSchema>;
export type AuthLogoutSuccessResponse = z.infer<typeof authLogoutSuccessResponseSchema>;
export type AuthLogoutErrorResponse = z.infer<typeof authLogoutErrorResponseSchema>;
export type AuthTokenPayload = z.infer<typeof authTokenPayloadSchema>;
export type AuthMeResponse = z.infer<typeof authMeResponseSchema>;
export type PendingGoogleRegistration = z.infer<typeof pendingGoogleRegistrationSchema>;
