export const AUTH_PAGE_PREFIXES = ['/login', '/register', '/complete-registration'] as const;

export const SIDEBAR_NAV_ITEMS = [
  { href: '/', label: 'Home' },
  { href: '/my-groups', label: 'My Groups' },
  { href: '/assignments', label: 'Assignments' },
  { href: '/ai-teachers-toolkit', label: "AI Teacher's Toolkit" },
  { href: '/my-library', label: 'My Library' },
  { href: '/create-assignment', label: 'Create Assignment' },
] as const;

const ROUTE_NAMES: Array<{ match: (pathname: string) => boolean; name: string }> = [
  { match: (pathname) => pathname === '/', name: 'Home' },
  { match: (pathname) => pathname === '/assignments', name: 'Assignments' },
  { match: (pathname) => pathname.startsWith('/assignments/'), name: 'Assignment Details' },
  { match: (pathname) => pathname === '/notifications', name: 'Notifications' },
  { match: (pathname) => pathname === '/create-assignment', name: 'Create Assignment' },
  { match: (pathname) => pathname === '/my-groups', name: 'My Groups' },
  { match: (pathname) => pathname === '/my-library', name: 'My Library' },
  { match: (pathname) => pathname === '/ai-teachers-toolkit', name: "AI Teacher's Toolkit" },
  { match: (pathname) => pathname === '/admin/schools', name: 'School Admin' },
  { match: (pathname) => pathname === '/admin/schools/search', name: 'School Search' },
  { match: (pathname) => pathname.startsWith('/admin/schools/search/'), name: 'School Details' },
];

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function resolvePageName(pathname: string): string {
  const exact = ROUTE_NAMES.find((route) => route.match(pathname));
  if (exact) {
    return exact.name;
  }

  const fallback = pathname.replace(/^\//, '').replace(/-/g, ' ').trim();
  if (!fallback) {
    return 'Dashboard';
  }

  return fallback
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
