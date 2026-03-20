'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/my-groups', label: 'My Groups' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/ai-teachers-toolkit', label: 'AI Teacher\'s Toolkit' },
  { href: '/my-library', label: 'My Library' },
  { href: '/create-assignment', label: 'Create Assignment' },
];

export default function Sidebar() {
  const pathname = usePathname();

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
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
