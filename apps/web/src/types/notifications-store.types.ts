import type { NotificationItem } from '@repo/shared/notification';

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export type NotificationsStore = {
  notifications: NotificationItem[];
  isLoading: boolean;
  errorMessage: string;
  deletingIds: Set<string>;
  realtimeStatus: RealtimeStatus;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  setRealtimeStatus: (status: RealtimeStatus) => void;
  onRealtimeCreated: (notification: NotificationItem) => void;
  onRealtimeDeleted: (notificationId: string) => void;
  onRealtimeRead: (notificationId: string) => void;
  onRealtimeCleared: () => void;
};
