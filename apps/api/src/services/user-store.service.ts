import bcrypt from 'bcryptjs';
import { type SchoolName, type UserRecord } from '@/models/auth.model';
import { SchoolModel } from '@/models/school.model';
import { type SchoolLike, type UserRecordLike } from '@/types/user-store.types';
import { UserModel } from '@/models/user.model';

const PROFILE_IMAGE_OPTIONS = ['/profile-images/1.png', '/profile-images/2.png', '/profile-images/3.png'] as const;

function getRandomProfileImage(): string {
  const randomIndex = Math.floor(Math.random() * PROFILE_IMAGE_OPTIONS.length);
  return PROFILE_IMAGE_OPTIONS[randomIndex] ?? PROFILE_IMAGE_OPTIONS[0];
}

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
    profileImage: doc.profileImage ?? PROFILE_IMAGE_OPTIONS[0],
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
      profileImage: getRandomProfileImage(),
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
}): Promise<UserRecord | null> {
  const credentialUsernameKey = input.username.trim().toLowerCase();
  const user = await UserModel.findOne({
    provider: 'credentials',
    credentialUsernameKey,
  });

  if (!user?.passwordHash) {
    return null;
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    return null;
  }

  const school = await SchoolModel.findById(user.school);

  if (!school || school.isActive === false) {
    return null;
  }

  return mapUserRecord(user, school);
}

export async function findGoogleUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await UserModel.findOne({ email: normalizedEmail, provider: 'google' });

  if (!user) {
    return null;
  }

  const school = await SchoolModel.findById(user.school);

  if (!school || school.isActive === false) {
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
        profileImage: getRandomProfileImage(),
      },
    },
    { upsert: true, new: true },
  );

  if (!updated) {
    throw new Error('Could not upsert google user');
  }

  return mapUserRecord(updated, school);
}
