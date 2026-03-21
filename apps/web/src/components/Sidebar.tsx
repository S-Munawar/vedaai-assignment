'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { isAuthPage, SIDEBAR_NAV_ITEMS } from '@/constants/navigation.constants';
import { Sparkles, Settings } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (isAuthPage(pathname)) {
    return null;
  }

  return (
    <aside className="bg-background rounded-xl py-3 pl-3 h-screen overflow-y-auto sticky top-0">
      <div className="flex flex-col gap-14 bg-white rounded-lg p-6 overflow-y-auto shadow-md h-full no-scrollbar">
        <div className="flex items-center gap-2">
          <img src="/vedaAI.png" alt="VedaAI Logo" className="rounded-xl w-10 h-10" />
          <h1 className="m-0 text-xl font-bold text-gray-800">VedaAI</h1>
        </div>

        <button 
          onClick={() => {
            router.push('/create-assignment');
          }}
          className="w-full shadow-lg bg-linear-to-b from-[#f77950] to-[#c0350a] rounded-full inline-block"
        >
          <div className="flex items-center justify-between gap-2.5 px-11 py-2 rounded-full bg-[#272727] text-white font-medium text-lg m-1">
            <Sparkles className="w-5 h-5" />
            Create Assignment
          </div>
        </button>

        <nav className="w-full">
          <ul className="list-none p-0 m-0 flex flex-col gap-2">
            {SIDEBAR_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block py-2 px-3 no-underline rounded-md transition-all duration-200 font-medium text-sm ${
                      isActive
                        ? 'bg-background text-primary'
                        : 'text-secondary hover:bg-background'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      <div className="mt-auto flex flex-col gap-2">
        <div className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-background text-secondary text-sm">
          <Settings />
          Settings
        </div>
        <div className='flex bg-background p-4 rounded-xl gap-4' >
          <div className="h-15 w-15 flex items-center bg-white justify-center rounded-full" >P</div>
          <div className="flex flex-col justify-center" >
            <p className="font-bold text-md text-primary" >Delhi Public School</p>
            <p className="font-normal text-md text-muted">Bokaro Steel City</p>
          </div>
        </div>
      </div>
      </div>
    </aside>
  );
}
