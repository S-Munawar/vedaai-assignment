import bcrypt from 'bcryptjs';
import { type SchoolName, type UserRecord } from '@/models/auth.model';
import { UserModel } from '@/models/user.model';

type UserRecordLike = {
  _id: { toString(): string };
  username: string;
  email?: string | null;
  schoolName: SchoolName;
  passwordHash?: string | null;
  provider: UserRecord['provider'];
};

function mapUserRecord(doc: UserRecordLike): UserRecord {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email ?? undefined,
    schoolName: doc.schoolName,
    passwordHash: doc.passwordHash ?? undefined,
    provider: doc.provider,
  };
}

export async function registerCredentialUser(input: {
  username: string;
  password: string;
  schoolName: SchoolName;
}): Promise<UserRecord> {
  const username = input.username.trim();
  const credentialUsernameKey = username.toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const doc = await UserModel.create({
      username,
      schoolName: input.schoolName,
      passwordHash,
      provider: 'credentials',
      credentialUsernameKey,
    });

    return mapUserRecord(doc);
  } catch (error) {
    const mongoError = error as { code?: number };

    if (mongoError?.code === 11000) {
      throw new Error('Username already exists');
    }

    throw error;
  }
}

export async function loginCredentialUser(input: {
  username: string;
  password: string;
  schoolName: SchoolName;
}): Promise<UserRecord | null> {
  const credentialUsernameKey = input.username.trim().toLowerCase();
  const user = await UserModel.findOne({
    provider: 'credentials',
    credentialUsernameKey,
    schoolName: input.schoolName,
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return mapUserRecord(user);
}

export async function upsertGoogleUser(input: {
  email: string;
  name: string;
  schoolName: SchoolName;
}): Promise<UserRecord> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const updated = await UserModel.findOneAndUpdate(
    { email: normalizedEmail, provider: 'google' },
    {
      $set: {
        username: input.name.trim() || 'Google User',
        schoolName: input.schoolName,
        email: normalizedEmail,
      },
      $setOnInsert: {
        provider: 'google',
      },
    },
    { upsert: true, new: true },
  );

  if (!updated) {
    throw new Error('Could not upsert google user');
  }

  return mapUserRecord(updated);
}
