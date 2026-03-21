import type { UserRecord } from '@/models/auth.model';

export type UserRecordLike = {
  _id: { toString(): string };
  username: string;
  email?: string | null;
  profileImage?: string | null;
  passwordHash?: string | null;
  provider: UserRecord['provider'];
};

export type SchoolLike = {
  _id: { toString(): string };
  name: string;
};
