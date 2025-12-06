"use client";

import { useMemo, useState, type ReactElement } from "react";
import type { Book } from "@/types/enums";

import { BookAdminPanel } from "@/components/books/book-admin-panel";
import { BannerManagementPanel } from "./banner-management-panel";

import { ManagedUser, UserManagementPanel } from "./user-management-panel";
import { ReviewManagementPanel } from "./review-management-panel";
import { SuggestionManagementPanel } from "./suggestion-management-panel";
import { SilentReadingEventPanel } from "./silent-reading-event-panel";
import type { Database } from "@/types/database.types";

type SectionKey = "books" | "users" | "reviews" | "suggestions" | "banners" | "silent-reading";

type AdminDashboardProps = {
  adminName: string;
  initialBooks: Book[];
  initialUsers: ManagedUser[];
  initialReviews: any[];
  initialSuggestions: any[];
  initialBanners: any[];
  initialEvents: Database["public"]["Tables"]["SilentReadingEvent"]["Row"][];
};

const sections: Array<{
  id: SectionKey;
  label: string;
  description: string;
  icon: ReactElement;
}> = [
    {
      id: "books",
      label: "Kelola Buku",
      description: "Tambahkan, perbarui, dan pantau stok koleksi perpustakaan.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M5 4h10a2 2 0 0 1 2 2v14l-3.5-2-3.5 2-3.5-2-3.5 2V6a2 2 0 0 1 2-2Z" />
        </svg>
      ),
    },
    {
      id: "banners",
      label: "Kelola Banner",
      description: "Atur banner promosi yang tampil di halaman beranda.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
        </svg>
      ),
    },
    {
      id: "users",
      label: "Kelola Pengguna",
      description: "Lihat dan ubah data akun pengguna serta peran aksesnya.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M8 7a4 4 0 1 0 8 0 4 4 0 0 0-8 0" />
          <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
        </svg>
      ),
    },
    {
      id: "reviews",
      label: "Kelola Review",
      description: "Pantau dan moderasi ulasan yang diberikan oleh pengguna.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      id: "silent-reading",
      label: "Silent Reading",
      description: "Kelola jadwal acara Silent Reading komunitas.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      ),
    },
    {
      id: "suggestions",
      label: "Saran Aplikasi",
      description: "Daftar masukan dan saran pengembangan dari pengguna.",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ];

export function AdminDashboard({ adminName, initialBooks, initialUsers, initialReviews, initialSuggestions, initialBanners, initialEvents }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("books");

  const current = useMemo(
    () => sections.find((section) => section.id === activeSection) ?? sections[0],
    [activeSection],
  );

  const initials = useMemo(() => {
    return adminName
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [adminName]);

  return (
    <div className="flex w-full flex-col gap-6 text-slate-900 lg:flex-row">
      <aside className="hidden w-72 flex-shrink-0 flex-col gap-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm shadow-sm shadow-slate-100 lg:flex">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-base font-semibold text-emerald-600">
            {initials}
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500">Administrator</p>
            <p className="text-sm font-semibold text-slate-900">{adminName}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {sections.map((section) => {
            const isActive = section.id === activeSection;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${isActive
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
              >
                <span className="flex items-center gap-3 text-sm font-semibold">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full border ${isActive ? "border-emerald-200 bg-emerald-100" : "border-slate-200 bg-slate-100"
                      }`}
                  >
                    {section.icon}
                  </span>
                  {section.label}
                </span>
                {isActive && (
                  <span className="text-xs uppercase tracking-widest text-emerald-600/90">AKTIF</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
          <p className="font-semibold uppercase tracking-widest text-slate-600">Tip Admin</p>
          <p className="mt-2">
            Segarkan halaman setelah melakukan migrasi database agar data terbaru ditarik ke panel.
          </p>
        </div>
      </aside>

      <div className="flex-1">
        <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm shadow-slate-100 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Administrator</p>
              <p className="text-base font-semibold text-slate-900">{adminName}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-600">
              {initials}
            </div>
          </div>
          <select
            value={activeSection}
            onChange={(event) => setActiveSection(event.target.value as SectionKey)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </div>

        <header className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm shadow-slate-100">
          <span className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
            {current.label}
          </span>
          <h1 className="text-3xl font-bold sm:text-4xl">
            {current.id === "books"
              ? "Dashboard Koleksi"
              : current.id === "banners"
                ? "Manajemen Banner"
                : current.id === "users"
                  ? "Manajemen Pengguna"
                  : current.id === "reviews"
                    ? "Moderasi Review"
                    : current.id === "silent-reading"
                      ? "Jadwal Silent Reading"
                      : "Saran Aplikasi"}
          </h1>
          <p className="max-w-2xl text-sm text-slate-500">{current.description}</p>
        </header>

        <section className="mt-6">
          {activeSection === "books" ? (
            <BookAdminPanel initialBooks={initialBooks} />
          ) : activeSection === "banners" ? (
            <BannerManagementPanel initialBanners={initialBanners} />
          ) : activeSection === "users" ? (
            <UserManagementPanel initialUsers={initialUsers} />
          ) : activeSection === "reviews" ? (
            <ReviewManagementPanel initialReviews={initialReviews} />
          ) : activeSection === "silent-reading" ? (
            <SilentReadingEventPanel initialEvents={initialEvents} />
          ) : (
            <SuggestionManagementPanel initialSuggestions={initialSuggestions} />
          )}
        </section>
      </div>
    </div>
  );
}
