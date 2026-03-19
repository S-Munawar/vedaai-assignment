import type { Types } from 'mongoose';
import { NotificationModel } from '@/models/notification.model';
import { emitNotificationCreatedEvent } from '@/socket/realtime.context';

export async function createAssignmentDeletedNotification(
  userId: Types.ObjectId,
  schoolId: Types.ObjectId,
  assignmentChapterName: string,
  deletedByUsername: string,
  assignmentId: Types.ObjectId,
) {
  try {
    const notification = await NotificationModel.create({
      user: userId,
      school: schoolId,
      type: 'assignment:deleted',
      title: 'Assignment Deleted',
      message: `${deletedByUsername} deleted the assignment "${assignmentChapterName}".`,
      relatedAssignmentId: assignmentId,
      relatedUserId: userId,
    });

    // Emit real-time event
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
  } catch (error) {
    console.error('❌ Error creating assignment deleted notification:', error);
  }
}
