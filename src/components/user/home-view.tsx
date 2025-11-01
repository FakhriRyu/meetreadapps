"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Book } from "@prisma/client";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  joinedAt?: Date | string;
  profileImage?: string | null;
};

type HomeViewProps = {
  books: Book[];
  sessionUser: SessionUser | null;
};

const DEFAULT_CATEGORY = "Semua";
const PROFILE_PLACEHOLDER_AVATAR = "https://api.dicebear.com/7.x/initials/png";

export function HomeView({ books, sessionUser }: HomeViewProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CATEGORY);
  const [activeAuthor, setActiveAuthor] = useState<string | null>(null);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    books.forEach((book) => {
      const label = book.category?.trim();
      if (label && label.length > 0) {
        unique.add(label);
      } else {
        unique.add("Umum");
      }
    });
    return [DEFAULT_CATEGORY, ...Array.from(unique).sort((a, b) => a.localeCompare(b, "id-ID"))];
  }, [books]);

  const resolvedCategory = categories.includes(activeCategory) ? activeCategory : DEFAULT_CATEGORY;

  const baseFilteredBooks = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return books.filter((book) => {
      const categoryLabel = book.category?.trim() ?? "Umum";
      const matchesCategory = resolvedCategory === DEFAULT_CATEGORY || categoryLabel === resolvedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        book.title.toLowerCase().includes(normalizedQuery) ||
        book.author.toLowerCase().includes(normalizedQuery) ||
        categoryLabel.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [books, resolvedCategory, search]);

  const authors = useMemo(() => {
    const unique = new Set<string>();
    baseFilteredBooks.forEach((book) => {
      if (book.author.trim().length > 0) {
        unique.add(book.author.trim());
      }
    });
    return Array.from(unique).slice(0, 12);
  }, [baseFilteredBooks]);

  const resolvedAuthor = activeAuthor && authors.includes(activeAuthor) ? activeAuthor : null;

  const filteredBooks = useMemo(() => {
    if (!resolvedAuthor) {
      return baseFilteredBooks;
    }
    const normalizedAuthor = resolvedAuthor.toLowerCase();
    return baseFilteredBooks.filter((book) => book.author.trim().toLowerCase() === normalizedAuthor);
  }, [baseFilteredBooks, resolvedAuthor]);

  const freshArrivals = useMemo(() => filteredBooks.slice(0, 6), [filteredBooks]);

  const topReads = useMemo(() => {
    if (filteredBooks.length === 0) {
      return [];
    }
    const scored = [...filteredBooks].sort((a, b) => {
      const scoreA = a.totalCopies - a.availableCopies;
      const scoreB = b.totalCopies - b.availableCopies;
      return scoreB - scoreA;
    });
    return scored.slice(0, 5);
  }, [filteredBooks]);

  const avatarInitials = useMemo(() => {
    const source = sessionUser?.name ?? sessionUser?.email ?? "MeetRead";
    return source
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .slice(0, 2)
      .join("");
  }, [sessionUser?.email, sessionUser?.name]);

  const avatarFallbackUrl = useMemo(() => {
    const seed = sessionUser?.name ?? sessionUser?.email ?? "MeetRead";
    return `${PROFILE_PLACEHOLDER_AVATAR}?seed=${encodeURIComponent(seed)}`;
  }, [sessionUser?.email, sessionUser?.name]);

  const profileImage = sessionUser?.profileImage?.trim() ?? null;
  const hasProfileImage = Boolean(profileImage);
  const firstName = sessionUser?.name?.split(" ")[0] ?? "Pembaca";

  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-24 pt-10">
        <header className="flex items-start justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm text-slate-500">Hai, {firstName}! 👋</p>
            <h1 className="text-2xl font-semibold text-slate-900">Temukan bacaan favoritmu.</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/notifikasi"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
              aria-label="Notifikasi"
            >
              <BellIcon />
              <span className="absolute right-2 top-2 block h-1.5 w-1.5 rounded-full bg-rose-400" />
            </Link>
            <Link
              href="/profil"
              className="relative block h-11 w-11 overflow-hidden rounded-full border border-slate-200 bg-white transition hover:border-slate-300"
              aria-label="Profil"
            >
              {hasProfileImage ? (
                <Image src={profileImage!} alt={sessionUser?.name ?? "Profil"} fill sizes="44px" className="object-cover" />
              ) : (
                <Image src={avatarFallbackUrl} alt={sessionUser?.name ?? "Profil"} fill sizes="44px" className="object-cover" />
              )}
              {!hasProfileImage && (
                <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
                  {avatarInitials}
                </span>
              )}
            </Link>
          </div>
        </header>

        <section className="mt-8 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <MagnifierIcon className="h-5 w-5 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari judul, penulis, atau kategori..."
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="-mx-2 flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const isActive = category === resolvedCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`mx-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                      : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-10 space-y-10">
          <div className="space-y-4">
            <SectionHeading label="Koleksi Populer" />
            <div className="-mx-2 flex gap-5 overflow-x-auto pb-2">
              {freshArrivals.length === 0 ? (
                <div className="mx-2 w-full rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                  Belum ada buku dalam kategori ini. Coba kata kunci lain ya!
                </div>
              ) : (
                freshArrivals.map((book) => (
                  <Link
                    key={`arrival-${book.id}`}
                    href={`/books/${book.id}`}
                    className="group relative mx-2 w-40 flex-shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-slate-100">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt={book.title}
                          fill
                          sizes="160px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          Tidak ada sampul
                        </div>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-semibold text-slate-900">{book.title}</p>
                    <p className="line-clamp-1 text-xs text-slate-500">{book.category ?? "Umum"}</p>
                    <span className="mt-3 inline-flex items-center text-xs font-medium text-indigo-500">
                      Telusuri
                      <ArrowIcon className="ml-1 h-3 w-3" />
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading label="Penulis Pilihan" />
            <div className="-mx-2 flex gap-3 overflow-x-auto pb-2">
              {authors.length === 0 ? (
                <div className="mx-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-sm shadow-slate-100">
                  Penulis belum tersedia untuk pilihan ini.
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveAuthor(null)}
                    aria-pressed={resolvedAuthor === null}
                    className={`mx-2 flex h-20 min-w-[7rem] items-center justify-center rounded-2xl px-4 text-center text-sm font-semibold transition ${
                      resolvedAuthor === null
                        ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                    }`}
                  >
                    Semua Penulis
                  </button>
                  {authors.map((author) => {
                    const isActive = resolvedAuthor === author;
                    return (
                      <button
                        type="button"
                        key={`author-${author}`}
                        onClick={() => setActiveAuthor(isActive ? null : author)}
                        aria-pressed={isActive}
                        className={`mx-2 flex h-20 min-w-[7rem] items-center justify-center rounded-2xl px-4 text-center text-sm font-semibold transition ${
                          isActive
                            ? "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
                        }`}
                      >
                        {author}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <SectionHeading label="Rekomendasi" caption="Berdasarkan peminjaman terbaru" />
            <div className="space-y-4">
              {topReads.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                  Buku yang kamu cari belum ditemukan. Yuk telusuri kategori lain!
                </div>
              ) : (
                topReads.map((book) => (
                  <Link
                    key={`top-${book.id}`}
                    href={`/books/${book.id}`}
                    className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
                  >
                    <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                      {book.coverImageUrl ? (
                        <Image src={book.coverImageUrl} alt={book.title} fill sizes="80px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                          Tidak ada sampul
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900">{book.title}</p>
                        <p className="text-xs text-slate-500">{book.author}</p>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>
                          Rilis:{" "}
                          <strong className="text-slate-700">{book.publishedYear ? book.publishedYear : "Tidak diketahui"}</strong>
                        </span>
                        <span>
                          Stok:{" "}
                          <strong className="text-slate-700">
                            {book.availableCopies}/{book.totalCopies}
                          </strong>
                        </span>
                        <span>
                          Kategori: <strong className="text-slate-700">{book.category ?? "Umum"}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="flex h-full items-center">
                      <ArrowIcon className="h-4 w-4 text-indigo-400" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionHeading({ label, caption }: { label: string; caption?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <span className="relative inline-flex text-lg font-semibold text-slate-900">
          {label}
          <span className="absolute left-0 bottom-0 h-2 w-full translate-y-2 rounded-full bg-indigo-200/70" aria-hidden />
        </span>
        {caption ? <p className="mt-3 text-xs text-slate-500">{caption}</p> : null}
      </div>
      <span className="text-xs font-medium text-indigo-500">Lihat semua</span>
    </div>
  );
}

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className ?? "h-5 w-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-2.6-2.6" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M18 16v-5a6 6 0 0 0-12 0v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16h14l-1.5 2.5a1 1 0 0 1-.86.5H7.36a1 1 0 0 1-.86-.5L5 16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className ?? "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
