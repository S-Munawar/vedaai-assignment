import { z } from 'zod';
import { mongoIdSchema } from './assignment';

export const notificationTypeSchema = z.enum(['assignment:created', 'assignment:deleted']);

export const notificationItemSchema = z.object({
  id: mongoIdSchema,
  type: notificationTypeSchema,
  title: z.string(),
  message: z.string(),
  isRead: z.boolean(),
  relatedAssignmentId: mongoIdSchema.nullable().default(null),
  relatedUserId: mongoIdSchema.nullable().default(null),
  createdAt: z.string(),
});

export const notificationsListResponseSchema = z.object({
  success: z.literal(true),
  notifications: z.array(notificationItemSchema),
  unreadCount: z.number().int().min(0),
});

export const notificationCreatedRealtimeEventSchema = z.object({
  type: z.literal('notification:created'),
  notification: notificationItemSchema,
});

export const notificationDeletedRealtimeEventSchema = z.object({
  type: z.literal('notification:deleted'),
  notificationId: mongoIdSchema,
  wasRead: z.boolean(),
});

export const notificationReadRealtimeEventSchema = z.object({
  type: z.literal('notification:read'),
  notificationId: mongoIdSchema,
});

export const notificationsClearedRealtimeEventSchema = z.object({
  type: z.literal('notifications:cleared'),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationsListResponse = z.infer<typeof notificationsListResponseSchema>;
export type NotificationCreatedRealtimeEvent = z.infer<typeof notificationCreatedRealtimeEventSchema>;
export type NotificationDeletedRealtimeEvent = z.infer<typeof notificationDeletedRealtimeEventSchema>;
export type NotificationReadRealtimeEvent = z.infer<typeof notificationReadRealtimeEventSchema>;
export type NotificationsClearedRealtimeEvent = z.infer<typeof notificationsClearedRealtimeEventSchema>;
