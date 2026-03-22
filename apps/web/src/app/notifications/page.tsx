"use client";

import Link from "next/link";
import { useEffect } from "react";
import Image from "next/image";
import {
  notificationCreatedRealtimeEventSchema,
  notificationDeletedRealtimeEventSchema,
  notificationReadRealtimeEventSchema,
  notificationsClearedRealtimeEventSchema,
} from "@repo/shared/notification";
import { setUnreadCount } from "@/lib/notifications-unread";
import { getRealtimeSocket } from "@/lib/realtime";
import { useNotifications } from "@/hooks/useNotifications";
import { PageHeader } from "@/components/PageHeader";

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
  }, [loadNotifications]);

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
  }, [setRealtimeStatus, onRealtimeCreated, onRealtimeDeleted, onRealtimeRead, onRealtimeCleared]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    setUnreadCount(unreadCount);
  }, [unreadCount]);

  const hasNotifications = notifications.length > 0;
  const showHeader = isLoading || Boolean(errorMessage) || hasNotifications;
  const showToolbar = !isLoading && !errorMessage && hasNotifications;
  const showEmptyState = !isLoading && !errorMessage && !hasNotifications;
  const showNotificationsList = !isLoading && !errorMessage && hasNotifications;

  return (
    <section className="flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-384 flex-1 flex-col gap-3 rounded-xl">
        <PageHeader
          title="Notifications"
          subtitle="Track activity and stay up to date with assignment events."
          showRealtime
          realtimeStatus={realtimeStatus}
          showHeader={showHeader}
        />

        {showToolbar ? (
          <div className="flex h-16 w-full items-center justify-between gap-4 rounded-2xl bg-white px-4 text-sm">
            <div className="flex items-center gap-3 text-primary">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-off-white-primary">
                <Image src="/icons/Bell.svg" alt="" aria-hidden="true" width={16} height={16} />
              </span>
              <div className="flex flex-col leading-tight">
                <p className="text-sm font-bold">Inbox</p>
                <p className="text-xs text-muted">
                  {unreadCount > 0
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                    : "All caught up"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleClearAll()}
              className="inline-flex h-10 items-center rounded-full bg-off-white-primary px-4 text-sm font-semibold text-primary transition hover:bg-gray-100"
            >
              Clear All
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl bg-white/70 p-5 text-sm text-muted">Loading notifications...</div>
        ) : null}

        {!isLoading && errorMessage ? (
          <div className="rounded-2xl bg-white/70 p-5 text-sm text-red-600">{errorMessage}</div>
        ) : null}

        {showEmptyState ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-off-white-primary">
              <Image src="/icons/Bell.svg" alt="" aria-hidden="true" width={18} height={18} />
            </div>
            <h2 className="text-base font-bold text-primary">No notifications yet</h2>
            <p className="mt-1 text-sm text-muted">New assignment activity will show up here.</p>
          </div>
        ) : null}

        {showNotificationsList ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-2xl border p-4 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition ${
                  notification.isRead
                    ? "border-border bg-white"
                    : "border-primary-orange/30 bg-primary-orange/5"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-primary">{notification.title}</h3>
                      {!notification.isRead ? (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary-orange" />
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-secondary">{notification.message}</p>
                    <p className="mt-2 text-xs text-muted">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {!notification.isRead ? (
                      <button
                        type="button"
                        onClick={() => void markAsRead(notification.id)}
                        className="inline-flex h-8 items-center rounded-full bg-off-white-primary px-3 text-xs font-semibold text-primary transition hover:bg-gray-100"
                      >
                        Mark as read
                      </button>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void deleteNotification(notification.id)}
                      disabled={deletingIds.has(notification.id)}
                      className="inline-flex h-8 items-center rounded-full border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingIds.has(notification.id) ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="mt-auto pt-2">
          <Link
            href="/assignments"
            className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-primary transition hover:bg-off-white-primary"
          >
            <Image src="/icons/Arrow_Left.svg" alt="" aria-hidden="true" width={16} height={16} />
            Back to assignments
          </Link>
        </div>
      </div>
    </section>
  );
}
