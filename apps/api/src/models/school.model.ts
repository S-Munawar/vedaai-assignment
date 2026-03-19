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
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type SchoolDocument = HydratedDocument<InferSchemaType<typeof schoolSchema>>;

export const SchoolModel = model('School', schoolSchema);
