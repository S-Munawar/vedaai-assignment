import bcrypt from 'bcryptjs';
import { type SchoolName, type UserRecord } from '@/models/auth.model';
import { SchoolModel } from '@/models/school.model';
import { UserModel } from '@/models/user.model';

type UserRecordLike = {
  _id: { toString(): string };
  username: string;
  email?: string | null;
  passwordHash?: string | null;
  provider: UserRecord['provider'];
};

type SchoolLike = {
  _id: { toString(): string };
  name: string;
};

function normalizeSchoolName(schoolName: string): string {
  return schoolName.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function findSchoolByName(schoolName: SchoolName) {
  const normalizedName = normalizeSchoolName(schoolName);
  return SchoolModel.findOne({ normalizedName });
}

async function findActiveSchoolByName(schoolName: SchoolName) {
  const normalizedName = normalizeSchoolName(schoolName);
  return SchoolModel.findOne({ normalizedName, isActive: { $ne: false } });
}

async function findOrCreateSchoolByName(schoolName: SchoolName) {
  const trimmedName = schoolName.trim();
  const normalizedName = normalizeSchoolName(trimmedName);

  const existing = await SchoolModel.findOne({ normalizedName });

  if (existing) {
    return existing;
  }

  try {
    return await SchoolModel.create({
      name: trimmedName,
      normalizedName,
    });
  } catch (error) {
    const mongoError = error as { code?: number };

    if (mongoError?.code === 11000) {
      const concurrent = await SchoolModel.findOne({ normalizedName });

      if (concurrent) {
        return concurrent;
      }
    }

    throw error;
  }
}

async function findExistingSchoolOrThrow(schoolName: SchoolName) {
  const school = await findActiveSchoolByName(schoolName);

  if (!school) {
    throw new Error('Selected school is not available. Please contact admin.');
  }

  return school;
}

function mapUserRecord(doc: UserRecordLike, school: SchoolLike): UserRecord {
  return {
    id: doc._id.toString(),
    username: doc.username,
    email: doc.email ?? undefined,
    schoolId: school._id.toString(),
    schoolName: school.name as SchoolName,
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
  const school = await findExistingSchoolOrThrow(input.schoolName);

  try {
    const doc = await UserModel.create({
      username,
      school: school._id,
      passwordHash,
      provider: 'credentials',
      credentialUsernameKey,
    });

    return mapUserRecord(doc, school);
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
  const school = await findActiveSchoolByName(input.schoolName);

  if (!school) {
    return null;
  }

  const credentialUsernameKey = input.username.trim().toLowerCase();
  const user = await UserModel.findOne({
    provider: 'credentials',
    credentialUsernameKey,
    school: school._id,
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  return mapUserRecord(user, school);
}

export async function upsertGoogleUser(input: {
  email: string;
  name: string;
  schoolName: SchoolName;
}): Promise<UserRecord> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const school = await findExistingSchoolOrThrow(input.schoolName);

  const updated = await UserModel.findOneAndUpdate(
    { email: normalizedEmail, provider: 'google' },
    {
      $set: {
        username: input.name.trim() || 'Google User',
        school: school._id,
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

  return mapUserRecord(updated, school);
}
