import type { Types } from 'mongoose';
import { NotificationModel } from '@/models/notification.model';
import { emitNotificationCreatedEvent } from '@/socket/realtime.context';

async function createNotificationAndEmit(
  userId: Types.ObjectId,
  schoolId: Types.ObjectId,
  type: 'assignment:created' | 'assignment:deleted',
  title: string,
  message: string,
  assignmentId: Types.ObjectId,
  actorUserId: Types.ObjectId,
) {
  const notification = await NotificationModel.create({
    user: userId,
    school: schoolId,
    type,
    title,
    message,
    relatedAssignmentId: assignmentId,
    relatedUserId: actorUserId,
  });

  emitNotificationCreatedEvent(userId.toString(), {
    type: 'notification:created',
    notification: {
      id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      relatedAssignmentId: notification.relatedAssignmentId?.toString() ?? null,
      relatedUserId: notification.relatedUserId?.toString() ?? null,
      createdAt: notification.createdAt.toISOString(),
    },
  });

  return notification;
}

export async function createAssignmentCreatedNotification(
  userId: Types.ObjectId,
  schoolId: Types.ObjectId,
  assignmentChapterName: string,
  createdByUsername: string,
  assignmentId: Types.ObjectId,
  actorUserId: Types.ObjectId,
) {
  try {
    return await createNotificationAndEmit(
      userId,
      schoolId,
      'assignment:created',
      'Assignment Created',
      `${createdByUsername} created a new assignment "${assignmentChapterName}".`,
      assignmentId,
      actorUserId,
    );
  } catch (error) {
    console.error('❌ Error creating assignment created notification:', error);
  }
}

export async function createAssignmentDeletedNotification(
  userId: Types.ObjectId,
  schoolId: Types.ObjectId,
  assignmentChapterName: string,
  deletedByUsername: string,
  assignmentId: Types.ObjectId,
  actorUserId: Types.ObjectId,
) {
  try {
    return await createNotificationAndEmit(
      userId,
      schoolId,
      'assignment:deleted',
      'Assignment Deleted',
      `${deletedByUsername} deleted the assignment "${assignmentChapterName}".`,
      assignmentId,
      actorUserId,
    );
  } catch (error) {
    console.error('❌ Error creating assignment deleted notification:', error);
  }
}
