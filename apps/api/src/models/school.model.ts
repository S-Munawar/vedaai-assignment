import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const schoolSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    board: {
      type: String,
      required: true,
      trim: true,
      default: 'CBSE',
    },
    medium: {
      type: String,
      required: true,
      trim: true,
      default: 'English',
    },
    schoolType: {
      type: String,
      required: true,
      trim: true,
      default: 'Private',
    },
    location: {
      addressLine: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      state: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      postalCode: { type: String, trim: true, default: '' },
    },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    principalName: {
      type: String,
      trim: true,
      default: '',
    },
    establishedYear: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type SchoolDocument = HydratedDocument<InferSchemaType<typeof schoolSchema>>;

export const SchoolModel = model('School', schoolSchema);
