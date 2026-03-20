'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authMeResponseSchema, type AuthTokenPayload } from '@repo/shared/auth';
import {
  notificationCreatedRealtimeEventSchema,
  notificationDeletedRealtimeEventSchema,
  notificationReadRealtimeEventSchema,
  notificationsClearedRealtimeEventSchema,
} from '@repo/shared/notification';
import { useAuth } from '@/hooks/useAuth';
import { getApiUrl } from '@/lib/api-base';
import { getRealtimeSocket } from '@/lib/realtime';
import {
  getUnreadCount,
  incrementUnreadCount,
  setUnreadCount,
  subscribeUnreadCount,
} from '@/lib/notifications-unread';
import { isAuthPage, resolvePageName } from '@/constants/navigation.constants';

function getInitials(user: AuthTokenPayload | null): string {
  const name = user?.username?.trim();
  if (!name) return 'U';

  const tokens = name.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'U';
  if (tokens.length === 1) return tokens[0]?.slice(0, 2).toUpperCase() || 'U';

  return `${tokens[0]?.[0] || ''}${tokens[1]?.[0] || ''}`.toUpperCase() || 'U';
}

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isLoggingOut } = useAuth();

  const [unreadCount, setUnreadCountState] = useState(0);
  const [authUser, setAuthUser] = useState<AuthTokenPayload | null>(null);

  const shouldHideNav = isAuthPage(pathname);
  const pageName = useMemo(() => resolvePageName(pathname), [pathname]);
  const isBackDisabled = pathname === '/';

  useEffect(() => {
    setUnreadCountState(getUnreadCount());

    return subscribeUnreadCount((value) => {
      setUnreadCountState(value);
    });
  }, []);

  useEffect(() => {
    if (!pathname.startsWith('/notifications')) {
      return;
    }

    setUnreadCount(0);
  }, [pathname]);

  useEffect(() => {
    async function loadAuthMe() {
      try {
        const response = await fetch(getApiUrl('/auth/me'), {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          setAuthUser(null);
          return;
        }

        const raw = await response.json().catch(() => null);
        const parsed = authMeResponseSchema.safeParse(raw);

        if (!parsed.success || !parsed.data.authenticated) {
          setAuthUser(null);
          return;
        }

        setAuthUser(parsed.data.user);
      } catch {
        setAuthUser(null);
      }
    }

    if (!shouldHideNav) {
      void loadAuthMe();
    }
  }, [shouldHideNav]);

  useEffect(() => {
    const socket = getRealtimeSocket();

    if (!socket) {
      return;
    }

    const onNotificationCreated = (payload: unknown) => {
      const parsed = notificationCreatedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      if (!parsed.data.notification.isRead) {
        incrementUnreadCount(1);
      }
    };

    const onNotificationRead = (payload: unknown) => {
      const parsed = notificationReadRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      const current = getUnreadCount();
      setUnreadCount(Math.max(0, current - 1));
    };

    const onNotificationDeleted = (payload: unknown) => {
      const parsed = notificationDeletedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success || parsed.data.wasRead) {
        return;
      }

      const current = getUnreadCount();
      setUnreadCount(Math.max(0, current - 1));
    };

    const onNotificationsCleared = (payload: unknown) => {
      const parsed = notificationsClearedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      setUnreadCount(0);
    };

    socket.on('notification:created', onNotificationCreated);
    socket.on('notification:read', onNotificationRead);
    socket.on('notification:deleted', onNotificationDeleted);
    socket.on('notifications:cleared', onNotificationsCleared);

    return () => {
      socket.off('notification:created', onNotificationCreated);
      socket.off('notification:read', onNotificationRead);
      socket.off('notification:deleted', onNotificationDeleted);
      socket.off('notifications:cleared', onNotificationsCleared);
    };
  }, []);

  async function handleLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  function handleGoBack() {
    if (isBackDisabled) {
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  }

  if (shouldHideNav) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleGoBack}
            aria-label="Go back"
            disabled={isBackDisabled}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition enabled:hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden="true" className="text-lg">←</span>
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">VedaAI Workspace</p>
            <h1 className="text-lg font-semibold text-gray-900">{pageName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-700 transition hover:bg-gray-100"
          >
            <span aria-hidden="true" className="text-lg">🔔</span>
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : null}
          </Link>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-gray-200 px-2 py-1.5 hover:bg-gray-100">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                {getInitials(authUser)}
              </span>
              <span className="hidden text-sm font-medium text-gray-700 sm:block">
                {authUser?.username || 'Profile'}
              </span>
              <span className="text-xs text-gray-500">▾</span>
            </summary>

            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
              <div className="mb-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-900">{authUser?.username || 'User'}</p>
                <p className="mt-1 text-xs text-gray-600">{authUser?.schoolName || 'School not available'}</p>
                {authUser?.email ? <p className="mt-1 text-xs text-gray-500">{authUser.email}</p> : null}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:opacity-60"
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
