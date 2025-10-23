"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  icon: JSX.Element;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/beranda", label: "Beranda", icon: <HomeIcon /> },
  { href: "/pinjam", label: "Pinjam", icon: <BorrowIcon /> },
  { href: "/koleksiku", label: "Koleksiku", icon: <CollectionIcon /> },
  { href: "/profil", label: "Profil", icon: <ProfileIcon /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 shadow-lg shadow-black/30 backdrop-blur">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition ${
              isActive ? "text-white" : "text-white/60"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                isActive
                  ? "border-white/20 bg-emerald-400/20 text-white"
                  : "border-transparent bg-white/5 text-white/70"
              }`}
            >
              {item.icon}
            </span>
            {item.label}
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

function ProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20a7.94 7.94 0 0 1 16 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
