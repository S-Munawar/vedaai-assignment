import {
  schoolNameSchema,
  type AuthProvider,
  type AuthTokenPayload,
  type AuthUser,
  type SchoolName,
} from '@repo/shared/auth';

export type { AuthProvider, AuthTokenPayload, SchoolName };

export type UserRecord = AuthUser & {
  passwordHash?: string;
};

export function isValidSchoolName(value: string): value is SchoolName {
  return schoolNameSchema.safeParse(value).success;
}
