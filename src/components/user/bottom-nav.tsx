"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactElement } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: ReactElement;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/beranda", label: "Beranda", icon: <HomeIcon /> },
  { href: "/pinjam", label: "Pinjam", icon: <BorrowIcon /> },
  { href: "/koleksiku", label: "Koleksiku", icon: <CollectionIcon /> },
  { href: "/activity", label: "Aktivitas", icon: <ActivityIcon /> },
  { href: "/profil", label: "Profil", icon: <ProfileIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 flex w-full max-w-md items-center justify-around rounded-full border border-slate-200 bg-white/95 px-2 py-2 shadow-lg shadow-slate-200 backdrop-blur">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={true}
            className={`flex flex-col items-center gap-0.5 rounded-full px-1.5 py-1.5 text-[10px] font-medium transition ${isActive ? "text-indigo-600" : "text-slate-500"
              }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border ${isActive
                ? "border-indigo-200 bg-indigo-100 text-indigo-600 shadow-sm shadow-indigo-100"
                : "border-slate-200 bg-slate-100 text-slate-500"
                }`}
            >
              {item.icon}
            </span>
            <span className="truncate max-w-[60px] text-center">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 10.75 12 4l9 6.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v7h5v-4h4v4h5v-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BorrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 6h12a4 4 0 0 1 4 4v10H8a4 4 0 0 1-4-4V6Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 4v16" strokeLinecap="round" />
      <path d="M17 4v16" strokeLinecap="round" />
      <path d="M10 8h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 12h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20a7.94 7.94 0 0 1 16 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
