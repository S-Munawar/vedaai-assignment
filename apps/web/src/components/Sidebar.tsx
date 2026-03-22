'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authMeResponseSchema, type AuthTokenPayload } from '@repo/shared/auth';
import { schoolDetailsResponseSchema } from '@repo/shared/schools';
import { isAuthPage, SIDEBAR_NAV_ITEMS } from '@/constants/navigation.constants';
import { getApiUrl } from '@/lib/api-base';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [authUser, setAuthUser] = useState<AuthTokenPayload | null>(null);
  const [schoolName, setSchoolName] = useState('School not available');
  const [schoolCity, setSchoolCity] = useState('City not available');

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
          setSchoolName('School not available');
          setSchoolCity('City not available');
          return;
        }

        setAuthUser(parsed.data.user);

        const schoolResponse = await fetch(getApiUrl(`/schools/${parsed.data.user.schoolId}`), {
          method: 'GET',
          credentials: 'include',
        });

        if (!schoolResponse.ok) {
          setSchoolName(parsed.data.user.schoolName || 'School not available');
          setSchoolCity('City not available');
          return;
        }

        const rawSchool = await schoolResponse.json().catch(() => null);
        const parsedSchool = schoolDetailsResponseSchema.safeParse(rawSchool);

        if (!parsedSchool.success) {
          setSchoolName(parsed.data.user.schoolName || 'School not available');
          setSchoolCity('City not available');
          return;
        }

        setSchoolName(parsedSchool.data.school.name || parsed.data.user.schoolName || 'School not available');
        setSchoolCity(parsedSchool.data.school.location.city || 'City not available');
      } catch {
        setAuthUser(null);
        setSchoolName('School not available');
        setSchoolCity('City not available');
      }
    }

    void loadAuthMe();
  }, []);

  if (isAuthPage(pathname)) {
    return null;
  }

  const footerLinks = [
    { href: '/', label: 'Home', iconSrc: '/mobile-icons/Home.svg' },
    { href: '/assignments', label: 'Assignments', iconSrc: '/mobile-icons/Assignments.svg' },
    { href: '/my-library', label: 'Library', iconSrc: '/mobile-icons/Library.svg' },
    { href: '/ai-teachers-toolkit', label: 'AI Toolkit', iconSrc: '/icons/Sparkles.svg' },
  ] as const;

  return (
    <>
      <aside className="sticky top-3 hidden overflow-hidden rounded-xl bg-background pl-3 md:block md:h-auto md:max-h-[calc(100vh-1.5rem)]">
        <div className="flex max-h-full flex-col gap-14 overflow-y-auto rounded-lg bg-white p-6 shadow-[16px_16px_36px_rgba(0,0,0,0.2)] no-scrollbar">
          <div className="flex items-center gap-2">
            <img src="/vedaAI.png" alt="VedaAI Logo" className="h-10 w-10 rounded-xl" />
            <h1 className="m-0 text-xl font-bold text-gray-800">VedaAI</h1>
          </div>

          <button
            onClick={() => {
              router.push('/create-assignment');
            }}
            className="inline-block w-full rounded-full bg-linear-to-b from-[#f77950] to-[#c0350a] shadow-lg"
          >
            <div className="m-1 flex items-center justify-between gap-2.5 rounded-full bg-[#272727] px-11 py-2 text-lg font-medium text-white">
              <Image src="/icons/Sparkles.svg" alt="" aria-hidden="true" width={20} height={20} />
              Create Assignment
            </div>
          </button>

          <nav className="w-full">
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {SIDEBAR_NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`block rounded-md px-3 py-2 text-sm font-medium no-underline transition-all duration-200 ${
                        isActive ? 'bg-off-white/20 text-primary' : 'text-secondary hover:bg-off-white/20'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Image src={item.iconSrc} alt="" aria-hidden="true" width={16} height={16} />
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-secondary hover:bg-off-white-primary">
              <Image src="/icons/Setting.svg" alt="" aria-hidden="true" width={20} height={20} />
              Settings
            </div>
            <div className="flex gap-4 rounded-xl bg-off-white-primary p-4">
              <img
                src={authUser?.profileImage || '/profile-images/1.png'}
                alt={authUser?.username ? `${authUser.username} profile` : 'School profile'}
                className="h-15 w-15 rounded-full object-cover"
              />
              <div className="flex flex-col justify-center">
                <p className="text-md font-bold text-primary">{schoolName}</p>
                <p className="text-md font-normal text-muted">{schoolCity}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <footer className="fixed bottom-2.5 left-2.5 right-2.5 z-50 md:hidden">
        <nav className="my-3 h-18 w-full rounded-3xl bg-dark px-6 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.2)]">
          <ul className="flex h-full items-center justify-between">
            {footerLinks.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex flex-col items-center gap-1 rounded-lg p-2.5 text-[12px] font-semibold transition ${
                      isActive ? 'text-white' : 'text-white/25 hover:text-white'
                    }`}
                  >
                    <Image
                      src={item.iconSrc}
                      alt=""
                      aria-hidden="true"
                      width={16}
                      height={16}
                      className={isActive ? 'opacity-100' : 'opacity-70'}
                    />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </footer>
    </>
  );
}