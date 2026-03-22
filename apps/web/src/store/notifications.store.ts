"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  clearNotificationsResponseSchema,
  deleteNotificationResponseSchema,
  markNotificationReadResponseSchema,
  notificationsListResponseSchema,
} from "@repo/shared/notification";
import { assignmentIntakeErrorResponseSchema } from "@repo/shared/assignment";
import { getApiUrl } from "@/lib/api-base";
import { setUnreadCount } from "@/lib/notifications-unread";
import type { NotificationsStore } from "@/types/notifications-store.types";

export const useNotificationsStore = create<
  NotificationsStore,
  [['zustand/devtools', never]]
>(
  devtools((set) => ({
  notifications: [],
  isLoading: true,
  errorMessage: "",
  deletingIds: new Set<string>(),
  realtimeStatus: "connecting",
  loadNotifications: async () => {
    set({ isLoading: true, errorMessage: "" });

    try {
      const response = await fetch(getApiUrl("/notifications"), {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const errorParsed = assignmentIntakeErrorResponseSchema.safeParse(rawError);
        set({
          errorMessage: errorParsed.success ? errorParsed.data.error : "Failed to load notifications",
        });
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = notificationsListResponseSchema.safeParse(raw);

      if (!parsed.success) {
        set({ errorMessage: "Unexpected response while loading notifications" });
        return;
      }

      set({ notifications: parsed.data.notifications });
      setUnreadCount(parsed.data.unreadCount);
    } catch {
      set({ errorMessage: "Could not reach backend endpoint." });
    } finally {
      set({ isLoading: false });
    }
  },
  markAsRead: async (notificationId) => {
    try {
      const response = await fetch(getApiUrl(`/notifications/${notificationId}/read`), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        set({ errorMessage: "Failed to mark notification as read" });
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = markNotificationReadResponseSchema.safeParse(raw);

      if (!parsed.success) {
        set({ errorMessage: "Unexpected response while marking notification as read" });
      }
    } catch {
      set({ errorMessage: "Could not reach backend endpoint." });
    }
  },
  deleteNotification: async (notificationId) => {
    set((state) => ({ deletingIds: new Set(state.deletingIds).add(notificationId) }));

    try {
      const response = await fetch(getApiUrl(`/notifications/${notificationId}`), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const rawError = await response.json().catch(() => null);
        const errorParsed = assignmentIntakeErrorResponseSchema.safeParse(rawError);
        set((state) => {
          const next = new Set(state.deletingIds);
          next.delete(notificationId);
          return {
            deletingIds: next,
            errorMessage: errorParsed.success ? errorParsed.data.error : "Failed to delete notification",
          };
        });
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = deleteNotificationResponseSchema.safeParse(raw);

      if (!parsed.success) {
        set((state) => {
          const next = new Set(state.deletingIds);
          next.delete(notificationId);
          return {
            deletingIds: next,
            errorMessage: "Unexpected response while deleting notification",
          };
        });
      }
    } catch {
      set((state) => {
        const next = new Set(state.deletingIds);
        next.delete(notificationId);
        return {
          deletingIds: next,
          errorMessage: "Could not reach backend endpoint.",
        };
      });
    }
  },
  clearAllNotifications: async () => {
    try {
      const response = await fetch(getApiUrl("/notifications"), {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        set({ errorMessage: "Failed to clear notifications" });
        return;
      }

      const raw = await response.json().catch(() => null);
      const parsed = clearNotificationsResponseSchema.safeParse(raw);

      if (!parsed.success) {
        set({ errorMessage: "Unexpected response while clearing notifications" });
      }
    } catch {
      set({ errorMessage: "Could not reach backend endpoint." });
    }
  },
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),
  onRealtimeCreated: (notification) =>
    set((state) => {
      if (state.notifications.some((item) => item.id === notification.id)) {
        return state;
      }

      return {
        notifications: [notification, ...state.notifications],
      };
    }),
  onRealtimeDeleted: (notificationId) =>
    set((state) => {
      const nextDeleting = new Set(state.deletingIds);
      nextDeleting.delete(notificationId);

      return {
        notifications: state.notifications.filter((item) => item.id !== notificationId),
        deletingIds: nextDeleting,
      };
    }),
  onRealtimeRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item,
      ),
    })),
  onRealtimeCleared: () => set({ notifications: [] }),
  }), { name: 'NotificationsStore' }),
);
