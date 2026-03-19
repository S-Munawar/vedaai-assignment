import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

const notificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    school: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['assignment:deleted'],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    relatedAssignmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
    },
    relatedUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type NotificationDocument = HydratedDocument<InferSchemaType<typeof notificationSchema>>;

export const NotificationModel = model('Notification', notificationSchema);
