import { Router } from 'express';
import {
	clearAllNotifications,
	deleteNotification,
	listNotifications,
	markNotificationAsRead,
} from '@/controllers/notifications.controller';

const notificationsRouter = Router();

notificationsRouter.get('/', listNotifications);
notificationsRouter.post('/:notificationId/read', markNotificationAsRead);
notificationsRouter.delete('/:notificationId', deleteNotification);
notificationsRouter.delete('/', clearAllNotifications);

export default notificationsRouter;
