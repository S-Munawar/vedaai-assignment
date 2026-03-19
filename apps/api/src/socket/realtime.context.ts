import type { Server } from 'socket.io';
import {
  assignmentCreatedRealtimeEventSchema,
  assignmentDeletedRealtimeEventSchema,
  type AssignmentCreatedRealtimeEvent,
  type AssignmentDeletedRealtimeEvent,
} from '@repo/shared/assignment';
import {
  notificationCreatedRealtimeEventSchema,
  notificationDeletedRealtimeEventSchema,
  notificationReadRealtimeEventSchema,
  notificationsClearedRealtimeEventSchema,
  type NotificationCreatedRealtimeEvent,
  type NotificationDeletedRealtimeEvent,
  type NotificationReadRealtimeEvent,
  type NotificationsClearedRealtimeEvent,
} from '@repo/shared/notification';

const ASSIGNMENT_CREATED_EVENT = 'assignment:created';
const ASSIGNMENT_DELETED_EVENT = 'assignment:deleted';
const NOTIFICATION_CREATED_EVENT = 'notification:created';
const NOTIFICATION_DELETED_EVENT = 'notification:deleted';
const NOTIFICATION_READ_EVENT = 'notification:read';
const NOTIFICATIONS_CLEARED_EVENT = 'notifications:cleared';

let io: Server | null = null;

export function setRealtimeServer(server: Server) {
  io = server;
}

export function getSchoolRoomName(schoolId: string) {
  return `school:${schoolId}`;
}

export function getUserRoomName(userId: string) {
  return `user:${userId}`;
}

export function emitAssignmentCreatedEvent(schoolId: string, payload: AssignmentCreatedRealtimeEvent) {
  const parsed = assignmentCreatedRealtimeEventSchema.safeParse(payload);

  if (!parsed.success || !io) {
    return;
  }

  io.to(getSchoolRoomName(schoolId)).emit(ASSIGNMENT_CREATED_EVENT, parsed.data);
}

export function emitAssignmentDeletedEvent(schoolId: string, payload: AssignmentDeletedRealtimeEvent) {
  const parsed = assignmentDeletedRealtimeEventSchema.safeParse(payload);

  if (!parsed.success || !io) {
    return;
  }

  io.to(getSchoolRoomName(schoolId)).emit(ASSIGNMENT_DELETED_EVENT, parsed.data);
}

export function emitNotificationCreatedEvent(userId: string, payload: NotificationCreatedRealtimeEvent) {
  const parsed = notificationCreatedRealtimeEventSchema.safeParse(payload);

  if (!parsed.success || !io) {
    return;
  }

  io.to(getUserRoomName(userId)).emit(NOTIFICATION_CREATED_EVENT, parsed.data);
}

export function emitNotificationDeletedEvent(userId: string, payload: NotificationDeletedRealtimeEvent) {
  const parsed = notificationDeletedRealtimeEventSchema.safeParse(payload);

  if (!parsed.success || !io) {
    return;
  }

  io.to(getUserRoomName(userId)).emit(NOTIFICATION_DELETED_EVENT, parsed.data);
}

export function emitNotificationReadEvent(userId: string, payload: NotificationReadRealtimeEvent) {
  const parsed = notificationReadRealtimeEventSchema.safeParse(payload);

  if (!parsed.success || !io) {
    return;
  }

  io.to(getUserRoomName(userId)).emit(NOTIFICATION_READ_EVENT, parsed.data);
}

export function emitNotificationsClearedEvent(userId: string, payload: NotificationsClearedRealtimeEvent) {
  const parsed = notificationsClearedRealtimeEventSchema.safeParse(payload);

  if (!parsed.success || !io) {
    return;
  }

  io.to(getUserRoomName(userId)).emit(NOTIFICATIONS_CLEARED_EVENT, parsed.data);
}
