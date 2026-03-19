import { createHash, randomUUID } from 'node:crypto';
import { type SchoolName, type UserRecord } from '@/models/auth.model';

const usersByUsername = new Map<string, UserRecord>();
const usersByEmail = new Map<string, UserRecord>();

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex');
}

export function registerCredentialUser(input: {
  username: string;
  password: string;
  schoolName: SchoolName;
}): UserRecord {
  const normalizedUsername = input.username.trim().toLowerCase();

  if (usersByUsername.has(normalizedUsername)) {
    throw new Error('Username already exists');
  }

  const user: UserRecord = {
    id: randomUUID(),
    username: input.username.trim(),
    schoolName: input.schoolName,
    passwordHash: hashPassword(input.password),
    provider: 'credentials',
  };

  usersByUsername.set(normalizedUsername, user);
  return user;
}

export function loginCredentialUser(input: {
  username: string;
  password: string;
  schoolName: SchoolName;
}): UserRecord | null {
  const normalizedUsername = input.username.trim().toLowerCase();
  const user = usersByUsername.get(normalizedUsername);

  if (
    !user ||
    user.provider !== 'credentials' ||
    user.schoolName !== input.schoolName ||
    user.passwordHash !== hashPassword(input.password)
  ) {
    return null;
  }

  return user;
}

export function upsertGoogleUser(input: {
  email: string;
  name: string;
  schoolName: SchoolName;
}): UserRecord {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = usersByEmail.get(normalizedEmail);

  const user: UserRecord =
    existing ||
    ({
      id: randomUUID(),
      username: input.name.trim(),
      email: normalizedEmail,
      schoolName: input.schoolName,
      provider: 'google',
    } as UserRecord);

  user.schoolName = input.schoolName;
  user.username = input.name.trim() || 'Google User';
  user.email = normalizedEmail;

  usersByEmail.set(normalizedEmail, user);
  return user;
}
