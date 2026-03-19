export const ALLOWED_SCHOOLS = ['Delhi Public Schoool'] as const;

export type SchoolName = (typeof ALLOWED_SCHOOLS)[number];

export type AuthProvider = 'credentials' | 'google';

export type UserRecord = {
  id: string;
  username: string;
  email?: string;
  schoolName: SchoolName;
  passwordHash?: string;
  provider: AuthProvider;
};

export type AuthTokenPayload = {
  sub: string;
  username?: string;
  email?: string;
  schoolName: SchoolName;
  provider: AuthProvider;
};

export function isValidSchoolName(value: string): value is SchoolName {
  return ALLOWED_SCHOOLS.includes(value as SchoolName);
}
