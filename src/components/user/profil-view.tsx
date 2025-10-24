"use client";

import Image from "next/image";
import { useState } from "react";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  joinedAt?: Date;
};

type ProfilViewProps = {
  sessionUser: SessionUser | null;
};

const PROFILE_PLACEHOLDER_AVATAR = "https://api.dicebear.com/7.x/initials/png";

export function ProfilView({ sessionUser }: ProfilViewProps) {
  const [isLoggingOut, setLoggingOut] = useState(false);
  const isAuthenticated = Boolean(sessionUser);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/login?from=profil");
    }
  };

  return (
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      {!isAuthenticated && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-xl shadow-black/30">
          <div className="flex items-center gap-4 border-b border-white/5 px-6 py-5">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-emerald-400 to-sky-400">
              <Image
                src={`${PROFILE_PLACEHOLDER_AVATAR}?seed=MeetRead`}
                alt="MeetRead Guest"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Selamat Datang</h2>
              <p className="text-xs text-white/60">Masuk untuk melihat profil lengkapmu</p>
            </div>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/30" />
          </div>
          <div className="space-y-3 px-6 py-5 text-sm text-white/70">
            <p>
              Akses riwayat peminjaman, simpan buku favorit, dan dapatkan rekomendasi yang lebih personal
              dengan masuk ke akun MeetRead.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign("/login?from=profil")}
              className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300"
            >
              Masuk / Daftar
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && sessionUser && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-xl shadow-black/30">
            <div className="flex items-center gap-4 border-b border-white/5 px-6 py-5">
              <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-emerald-400 to-sky-400">
                <Image
                  src={`${PROFILE_PLACEHOLDER_AVATAR}?seed=${encodeURIComponent(sessionUser.name)}`}
                  alt={sessionUser.name}
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white">{sessionUser.name}</h2>
                <p className="text-xs text-emerald-300">Online</p>
                {sessionUser.joinedAt && (
                  <p className="text-xs text-white/50">
                    Bergabung sejak{" "}
                    {new Date(sessionUser.joinedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>

            <ul className="divide-y divide-white/5 text-sm text-white/80">
              <ProfileMenuItem icon={<ThemesIcon />} shortcut="⌘1" label="Tema" />
              <ProfileMenuItem icon={<SettingsIcon />} shortcut="⌘2" label="Pengaturan" />
              <ProfileMenuItem icon={<NotificationIcon />} shortcut="⌘3" label="Notifikasi" />
              <ProfileMenuItem icon={<HotkeysIcon />} label="Shortcut" hasArrow />
              <ProfileMenuItem icon={<DownloadIcon />} label="Aplikasi" hasArrow />
              <ProfileMenuItem icon={<GiftIcon />} label="Referensi" badge="Baru" />
              <ProfileMenuItem icon={<HelpIcon />} label="Bantuan" external />
            </ul>

            <div className="space-y-3 border-t border-white/5 px-6 py-5 text-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 px-4 py-3 text-left text-white/80 transition hover:border-white/20 hover:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  <TrashIcon />
                  Arsip
                </span>
                <span className="text-xs text-white/40">⌘⌫</span>
              </button>
              <button
                type="button"
                disabled={isLoggingOut}
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-left text-sm font-semibold text-rose-400 transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogoutIcon />
                {isLoggingOut ? "Keluar..." : "Keluar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type ProfileMenuItemProps = {
  icon: JSX.Element;
  label: string;
  shortcut?: string;
  hasArrow?: boolean;
  badge?: string;
  external?: boolean;
};

function ProfileMenuItem({ icon, label, shortcut, hasArrow, badge, external }: ProfileMenuItemProps) {
  return (
    <li>
      <button
        type="button"
        className="flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-white/5"
      >
        <span className="flex items-center gap-3 text-white">
          <span className="text-white/70">{icon}</span>
          <span>{label}</span>
          {badge && (
            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-200">
              {badge}
            </span>
          )}
        </span>
        <span className="flex items-center gap-2 text-xs text-white/40">
          {shortcut && <span>{shortcut}</span>}
          {external ? <ExternalIcon /> : hasArrow ? <ArrowRightIcon /> : null}
        </span>
      </button>
    </li>
  );
}

function ThemesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 12h16" strokeLinecap="round" />
      <path d="M12 4a4 4 0 1 1 0 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20a4 4 0 1 0 0-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-1 1 1 0 0 0-1.1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-1-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 1-.6 1 1 0 0 0-.2-1.1l-.1-.1A2 2 0 1 1 7.7 4.2l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-1V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6 1 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 1 .6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-1 .6Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M18 16v-5a6 6 0 0 0-12 0v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16h14l-1.5 2.5a1 1 0 0 1-.86.5H7.36a1 1 0 0 1-.86-.5L5 16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HotkeysIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 16h6" strokeLinecap="round" />
      <path d="M17 13v6" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3v12" strokeLinecap="round" />
      <path d="m6 11 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 21h14" strokeLinecap="round" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" strokeLinecap="round" />
      <path d="M2 7h20v5H2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 22V7" strokeLinecap="round" />
      <path d="M12 7h4a2 2 0 1 0-2-2c0 1.1-2 2-2 2Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 7H8a2 2 0 1 1 2-2c0 1.1 2 2 2 2Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M10 11v6" strokeLinecap="round" />
      <path d="M14 11v6" strokeLinecap="round" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 19a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M14 3h7v7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m21 3-10 10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v7a2 2 0 0 0 2 2h7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
