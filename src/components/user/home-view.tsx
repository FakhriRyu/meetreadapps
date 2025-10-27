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
};

type HomeViewProps = {
  books: Book[];
  sessionUser: SessionUser | null;
};

const DEFAULT_CATEGORY = "Semua";

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

  const stats = useMemo(() => {
    const total = books.length;
    const available = books.reduce((sum, book) => sum + book.availableCopies, 0);
    return { total, available };
  }, [books]);

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-60 w-60 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-28 pt-10">
        <header className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-left text-xs font-semibold uppercase tracking-widest text-white/70 transition hover:border-white/20 hover:bg-white/15"
            >
              <LocationIcon />
              <span>Jakarta, Indonesia</span>
              <ChevronDownIcon />
            </button>

            <div className="flex items-center gap-3">
              <Link
                href="/notifikasi"
                className="relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:border-white/20 hover:bg-white/15"
                aria-label="Notifikasi"
              >
                <BellIcon />
                <span className="absolute right-2 top-2 block h-1.5 w-1.5 rounded-full bg-rose-400" />
              </Link>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold">
                {(sessionUser?.name ?? "MeetRead")
                  .split(" ")
                  .map((part) => part.charAt(0).toUpperCase())
                  .slice(0, 2)
                  .join("")}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-lg shadow-black/20">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
              <MagnifierIcon className="h-4 w-4 text-white/60" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari judul, penulis, atau kategori..."
                className="flex-1 bg-transparent text-sm text-white placeholder-white/60 focus:outline-none"
              />
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/70 transition hover:border-white/20 hover:bg-white/10"
                aria-label="Pencarian suara"
              >
                <MicIcon />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs text-white/70">
              <div>
                <p>Total Koleksi</p>
                <p className="text-lg font-semibold text-white">{stats.total} Buku</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p>Eksemplar Tersedia</p>
                <p className="text-lg font-semibold text-white">{stats.available}</p>
              </div>
            </div>
          </div>

          <div className="-mx-2 flex gap-2 overflow-x-auto pb-2 pt-1">
            {categories.map((category) => {
              const isActive = category === resolvedCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </header>

        <section className="mt-8 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Fresh Arrivals</h2>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {freshArrivals.length} Buku
              </span>
            </div>
            <div className="-mx-2 flex gap-4 overflow-x-auto pb-2">
              {freshArrivals.length === 0 ? (
                <div className="mx-2 w-full rounded-3xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/70">
                  Belum ada buku dalam kategori ini. Coba kata kunci lain ya!
                </div>
              ) : (
                freshArrivals.map((book) => (
                  <Link
                    key={`arrival-${book.id}`}
                    href={`/books/${book.id}`}
                    className="group relative mx-2 w-36 flex-shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-white/5 bg-white/10">
                      {book.coverImageUrl ? (
                        <Image
                          src={book.coverImageUrl}
                          alt={book.title}
                          fill
                          sizes="150px"
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                          Tidak ada sampul
                        </div>
                      )}
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-semibold text-white">{book.title}</p>
                    <p className="line-clamp-1 text-xs text-white/60">{book.category ?? "Umum"}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Authors</h2>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                {authors.length} Terpilih
              </span>
            </div>
          <div className="-mx-2 flex gap-3 overflow-x-auto pb-2">
            {authors.length === 0 ? (
              <div className="mx-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                Penulis belum tersedia untuk pilihan ini.
              </div>
            ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveAuthor(null)}
                    aria-pressed={resolvedAuthor === null}
                    className={`mx-2 flex h-16 min-w-[6rem] items-center justify-center rounded-2xl border px-4 text-center text-xs font-semibold transition ${
                      resolvedAuthor === null
                        ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100 shadow-md shadow-emerald-400/20"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
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
                        className={`mx-2 flex h-16 min-w-[6rem] items-center justify-center rounded-2xl border px-4 text-center text-xs font-semibold transition ${
                          isActive
                            ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100 shadow-md shadow-emerald-400/20"
                            : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:text-white"
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Top Reads</h2>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Rekomendasi
              </span>
            </div>
            <div className="space-y-4">
              {topReads.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
                  Buku yang kamu cari belum ditemukan. Yuk telusuri kategori lain!
                </div>
              ) : (
                topReads.map((book) => {
                  const rating =
                    Math.round((4.2 + (1 - book.availableCopies / Math.max(book.totalCopies, 1)) * 0.6) * 10) / 10;
                  return (
                    <Link
                      key={`top-${book.id}`}
                      href={`/books/${book.id}`}
                      className="flex gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 transition hover:border-white/20 hover:bg-white/10"
                    >
                      <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                        {book.coverImageUrl ? (
                          <Image
                            src={book.coverImageUrl}
                            alt={book.title}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                            Tidak ada sampul
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-white">{book.title}</p>
                            <p className="text-xs text-white/60">{book.author}</p>
                          </div>
                          <div className="flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-100">
                            <StarIcon />
                            {rating.toFixed(1)}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-white/60">
                          <span>
                            Rilis:{" "}
                            <strong className="text-white/80">
                              {book.publishedYear ? book.publishedYear : "Tidak diketahui"}
                            </strong>
                          </span>
                          <span>
                            Stok:{" "}
                            <strong className="text-white/80">
                              {book.availableCopies}/{book.totalCopies}
                            </strong>
                          </span>
                          <span>
                            Kategori: <strong className="text-white/80">{book.category ?? "Umum"}</strong>
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function MagnifierIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className={className ?? "h-4 w-4"}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-2.6-2.6" strokeLinecap="round" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <path d="M12 19v3" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 21s6-4.7 6-10a6 6 0 1 0-12 0c0 5.3 6 10 6 10Z" />
      <circle cx="12" cy="11" r="2.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M18 16v-5a6 6 0 0 0-12 0v5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 16h14l-1.5 2.5a1 1 0 0 1-.86.5H7.36a1 1 0 0 1-.86-.5L5 16Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5"
      fill="currentColor"
    >
      <path d="m12 3.5 2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.4-4.6 2.4.9-5.2-3.8-3.7 5.2-.8L12 3.5Z" />
    </svg>
  );
}
