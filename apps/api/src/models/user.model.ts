import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { ALLOWED_SCHOOLS } from '@/models/auth.model';

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
    schoolName: {
      type: String,
      enum: ALLOWED_SCHOOLS,
      required: true,
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
