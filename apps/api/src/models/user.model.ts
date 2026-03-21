import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const PROFILE_IMAGE_OPTIONS = ['/profile-images/1.png', '/profile-images/2.png', '/profile-images/3.png'] as const;

function getRandomProfileImage(): string {
  const randomIndex = Math.floor(Math.random() * PROFILE_IMAGE_OPTIONS.length);
  return PROFILE_IMAGE_OPTIONS[randomIndex] ?? PROFILE_IMAGE_OPTIONS[0];
}

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true,
    },
    profileImage: {
      type: String,
      default: getRandomProfileImage,
      trim: true,
    },
    school: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    passwordHash: {
      type: String,
    },
    provider: {
      type: String,
      enum: ['credentials', 'google'],
      required: true,
    },
    credentialUsernameKey: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;

export const UserModel = model('User', userSchema);
