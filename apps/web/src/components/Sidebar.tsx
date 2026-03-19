'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { assignmentCreatedRealtimeEventSchema } from '@repo/shared/assignment';
import { useAuth } from '@/hooks/useAuth';
import { getRealtimeSocket } from '@/lib/realtime';
import {
  clearUnreadCount,
  getUnreadCount,
  incrementUnreadCount,
  subscribeUnreadCount,
} from '@/lib/notifications-unread';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/my-groups', label: 'My Groups' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/ai-teachers-toolkit', label: 'AI Teacher\'s Toolkit' },
  { href: '/my-library', label: 'My Library' },
  { href: '/create-assignment', label: 'Create Assignment' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggingOut, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(getUnreadCount());

    return subscribeUnreadCount((value) => {
      setUnreadCount(value);
    });
  }, []);

  useEffect(() => {
    if (!pathname.startsWith('/notifications')) {
      return;
    }

    clearUnreadCount();
  }, [pathname]);

  useEffect(() => {
    const socket = getRealtimeSocket();

    if (!socket) {
      return;
    }

    const onAssignmentCreated = (payload: unknown) => {
      const parsed = assignmentCreatedRealtimeEventSchema.safeParse(payload);

      if (!parsed.success) {
        return;
      }

      if (pathname.startsWith('/notifications')) {
        return;
      }

      incrementUnreadCount(1);
    };

    socket.on('assignment:created', onAssignmentCreated);

    return () => {
      socket.off('assignment:created', onAssignmentCreated);
    };
  }, [pathname]);

  async function handleLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/complete-registration')
  ) {
    return null;
  }

  return (
    <aside className="w-64 bg-gray-100 border-r border-gray-200 p-5 h-screen overflow-y-auto sticky top-0">
      <div className="mb-7 pb-5 border-b-2 border-gray-200">
        <h1 className="m-0 text-2xl font-bold text-gray-800">VedaAI</h1>
      </div>
      <nav className="w-full">
        <ul className="list-none p-0 m-0">
          {navigationItems.map((item) => (
            <li key={item.href} className="mb-2.5">
              <Link
                href={item.href}
                className={`block px-4 py-3 no-underline rounded-md transition-all duration-200 font-medium text-sm ${
                  pathname === item.href
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-300 hover:text-gray-800'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span>{item.label}</span>
                  {item.href === '/notifications' && unreadCount > 0 ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        pathname === item.href ? 'bg-white text-blue-700' : 'bg-blue-600 text-white'
                      }`}
                    >
                      {unreadCount}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full px-4 py-3 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
