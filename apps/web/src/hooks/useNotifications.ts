"use client";

import { useNotificationsStore } from "@/store/notifications.store";

export function useNotifications() {
  const notifications = useNotificationsStore((state) => state.notifications);
  const isLoading = useNotificationsStore((state) => state.isLoading);
  const errorMessage = useNotificationsStore((state) => state.errorMessage);
  const deletingIds = useNotificationsStore((state) => state.deletingIds);
  const realtimeStatus = useNotificationsStore((state) => state.realtimeStatus);

  const loadNotifications = useNotificationsStore((state) => state.loadNotifications);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);
  const deleteNotification = useNotificationsStore((state) => state.deleteNotification);
  const clearAllNotifications = useNotificationsStore((state) => state.clearAllNotifications);
  const setRealtimeStatus = useNotificationsStore((state) => state.setRealtimeStatus);
  const onRealtimeCreated = useNotificationsStore((state) => state.onRealtimeCreated);
  const onRealtimeDeleted = useNotificationsStore((state) => state.onRealtimeDeleted);
  const onRealtimeRead = useNotificationsStore((state) => state.onRealtimeRead);
  const onRealtimeCleared = useNotificationsStore((state) => state.onRealtimeCleared);

  return {
    notifications,
    isLoading,
    errorMessage,
    deletingIds,
    realtimeStatus,
    loadNotifications,
    markAsRead,
    deleteNotification,
    clearAllNotifications,
    setRealtimeStatus,
    onRealtimeCreated,
    onRealtimeDeleted,
    onRealtimeRead,
    onRealtimeCleared,
  };
}
