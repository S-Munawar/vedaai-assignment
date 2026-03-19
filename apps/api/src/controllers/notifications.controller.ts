import type { Request, Response } from 'express';
import { Types } from 'mongoose';
import { mongoIdSchema } from '@repo/shared/assignment';
import { NotificationModel } from '@/models/notification.model';
import { UserModel } from '@/models/user.model';
import { verifyAuthToken } from '@/services/auth-token.service';
import {
  emitNotificationDeletedEvent,
  emitNotificationReadEvent,
  emitNotificationsClearedEvent,
} from '@/socket/realtime.context';
import { parseCookie } from '@/utils/cookie.util';

type AuthenticatedUser = {
  _id: Types.ObjectId;
  school: Types.ObjectId;
};

async function requireAuthenticatedUser(req: Request, res: Response): Promise<AuthenticatedUser | null> {
  const token = parseCookie(req.headers.cookie);

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  const authPayload = await verifyAuthToken(token);

  if (!authPayload) {
    res.status(401).json({ success: false, error: 'Invalid authentication token' });
    return null;
  }

  const user = await UserModel.findById(authPayload.sub).select('_id school');

  if (!user) {
    res.status(401).json({ success: false, error: 'Authenticated user no longer exists' });
    return null;
  }

  return user as AuthenticatedUser;
}

export async function listNotifications(req: Request, res: Response) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const notifications = await NotificationModel.find({ user: user._id })
      .sort({ createdAt: -1 })
      .select('_id type title message isRead relatedAssignmentId relatedUserId createdAt');

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({
      success: true,
      notifications: notifications.map((notification) => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        relatedAssignmentId: notification.relatedAssignmentId?.toString() ?? null,
        relatedUserId: notification.relatedUserId?.toString() ?? null,
        createdAt: notification.createdAt.toISOString(),
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('❌ Error listing notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to list notifications' });
  }
}

export async function markNotificationAsRead(req: Request, res: Response) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const idParsed = mongoIdSchema.safeParse(req.params.notificationId);

    if (!idParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid notification id' });
    }

    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: idParsed.data,
        user: user._id,
      },
      { isRead: true },
      { new: true },
    ).select('_id isRead');

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Emit real-time event
    emitNotificationReadEvent(user._id.toString(), {
      type: 'notification:read',
      notificationId: idParsed.data,
    });

    return res.json({ success: true, notificationId: idParsed.data });
  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    return res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
}

export async function deleteNotification(req: Request, res: Response) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    const idParsed = mongoIdSchema.safeParse(req.params.notificationId);

    if (!idParsed.success) {
      return res.status(400).json({ success: false, error: 'Invalid notification id' });
    }

    const notification = await NotificationModel.findOneAndDelete({
      _id: idParsed.data,
      user: user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Emit real-time event
    emitNotificationDeletedEvent(user._id.toString(), {
      type: 'notification:deleted',
      notificationId: idParsed.data,
    });

    return res.json({ success: true, notificationId: idParsed.data });
  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
}

export async function clearAllNotifications(req: Request, res: Response) {
  try {
    const user = await requireAuthenticatedUser(req, res);

    if (!user) {
      return;
    }

    await NotificationModel.deleteMany({ user: user._id });

    // Emit real-time event
    emitNotificationsClearedEvent(user._id.toString(), {
      type: 'notifications:cleared',
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('❌ Error clearing notifications:', error);
    return res.status(500).json({ success: false, error: 'Failed to clear notifications' });
  }
}
