"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  notificationCreatedRealtimeEventSchema,
  notificationDeletedRealtimeEventSchema,
  notificationReadRealtimeEventSchema,
  notificationsClearedRealtimeEventSchema,
} from "@repo/shared/notification";
import { setUnreadCount } from "@/lib/notifications-unread";
import { getRealtimeSocket } from "@/lib/realtime";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationsPage() {
  const {
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
  } = useNotifications();

  useEffect(() => {
    void loadNotifications();
  }, []);

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all notifications?")) {
      return;
    }

    await clearAllNotifications();
  };

  useEffect(() => {
    const socket = getRealtimeSocket();

    if (!socket) {
      setRealtimeStatus("disconnected");
      return;
    }

    setRealtimeStatus(socket.connected ? "connected" : "connecting");

    const onNotificationCreated = (payload: unknown) => {
      const parsed = notificationCreatedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      onRealtimeCreated(parsed.data.notification);
    };

    const onNotificationDeleted = (payload: unknown) => {
      const parsed = notificationDeletedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      onRealtimeDeleted(parsed.data.notificationId);
    };

    const onNotificationRead = (payload: unknown) => {
      const parsed = notificationReadRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      onRealtimeRead(parsed.data.notificationId);
    };

    const onNotificationsCleared = (payload: unknown) => {
      const parsed = notificationsClearedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      onRealtimeCleared();
    };

    const onConnect = () => setRealtimeStatus("connected");
    const onDisconnect = () => setRealtimeStatus("disconnected");
    const onReconnectAttempt = () => setRealtimeStatus("reconnecting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.on("notification:created", onNotificationCreated);
    socket.on("notification:deleted", onNotificationDeleted);
    socket.on("notification:read", onNotificationRead);
    socket.on("notifications:cleared", onNotificationsCleared);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.off("notification:created", onNotificationCreated);
      socket.off("notification:deleted", onNotificationDeleted);
      socket.off("notification:read", onNotificationRead);
      socket.off("notifications:cleared", onNotificationsCleared);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount]);

  return (
    <section className="min-h-screen bg-[#f5f5f5] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl rounded-xl border border-gray-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)] sm:p-8">
        <header className="mb-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  realtimeStatus === "connected"
                    ? "bg-green-100 text-green-700"
                    : realtimeStatus === "reconnecting"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                Realtime: {realtimeStatus}
              </span>
              {notifications.length > 0 && (
                <button
                  onClick={() => void handleClearAll()}
                  className="rounded px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        </header>

        {isLoading ? <p className="text-sm text-gray-500">Loading notifications...</p> : null}
        {!isLoading && errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

        {!isLoading && !errorMessage && notifications.length === 0 ? (
          <p className="text-sm text-gray-500">No notifications yet.</p>
        ) : null}

        {!isLoading && !errorMessage && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 ${
                  notification.isRead ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{notification.title}</h3>
                      {!notification.isRead && <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{notification.message}</p>
                    <p className="mt-2 text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => void markAsRead(notification.id)}
                        className="rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100"
                      >
                        Read
                      </button>
                    )}
                    <button
                      onClick={() => void deleteNotification(notification.id)}
                      disabled={deletingIds.has(notification.id)}
                      className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingIds.has(notification.id) ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-6">
          <Link href="/assignments" className="text-sm font-medium text-gray-700 hover:text-black">
            ← Back to assignments
          </Link>
        </div>
      </div>
    </section>
  );
}
