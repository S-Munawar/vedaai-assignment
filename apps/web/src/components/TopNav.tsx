'use client';

import Image from 'next/image';
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
import { isAuthPage, resolvePageName, SIDEBAR_NAV_ITEMS } from '@/constants/navigation.constants';

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
  const pageIconSrc = useMemo(() => {
    const matchedItem = SIDEBAR_NAV_ITEMS.find(
      (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`)),
    );

    return matchedItem?.iconSrc || '/icons/Home.svg';
  }, [pathname]);
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
    <header className="sticky top-0 z-40 rounded-2xl bg-white px-6 sm:bg-white/75">
      <div className="flex h-16 items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 md:hidden">
          <Image src="/VedeMobile.svg" alt="VedaAI Logo" className="rounded-xl w-10 h-10" width={40} height={40} />
          <h1 className="m-0 text-xl font-bold text-gray-800">VedaAI</h1>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={handleGoBack}
            aria-label="Go back"
            disabled={isBackDisabled}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <Image src="/icons/Arrow_Left.svg" alt="" aria-hidden="true" width={20} height={20} />
          </button>

          <div className="flex items-center gap-2 text-disabled text-base font-semibold">
            <Image src={pageIconSrc} alt="" aria-hidden="true" width={20} height={20} />
            <h1>{pageName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative bg-off-white-primary inline-flex h-9 w-9 items-center justify-center rounded-full"
          >
            <Image src="/icons/Bell.svg" alt="" aria-hidden="true" width={20} height={20} />
            {unreadCount > 0 ? (
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary-orange" />
            ) : null}
          </Link>

          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap rounded-xl bg-white px-2 py-1 md:gap-2 md:px-3 md:py-1.5 md:shadow-[-12px_24px_32px_-8px_rgba(240,240,240,2)]">
              {authUser?.profileImage ? (
                <Image
                  src={authUser.profileImage}
                  alt={authUser?.username ? `${authUser.username} profile` : 'Profile'}
                  className="h-8 w-8 rounded-full object-cover"
                  width={32}
                  height={32}
                  unoptimized
                />
              ) : (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                  {getInitials(authUser)}
                </span>
              )}
              <span className="hidden text-sm font-medium text-gray-700 md:block">
                {authUser?.username || 'Profile'}
              </span>
              <Image
                src="/icons/Chevron.svg"
                alt=""
                aria-hidden="true"
                width={10}
                height={6}
                className="hidden md:block"
              />
            </summary>

            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-3 border border-gray-100">
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

          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full md:hidden"
          >
            <Image src="/icons/Menu.svg" alt="" aria-hidden="true" width={20} height={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
