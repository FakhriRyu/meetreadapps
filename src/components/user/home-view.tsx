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
  joinedAt?: Date;
};

type HomeViewProps = {
  books: Book[];
  sessionUser: SessionUser | null;
};

export function HomeView({ books, sessionUser }: HomeViewProps) {
  const [search, setSearch] = useState("");

  const filteredBooks = useMemo(() => {
    if (!search.trim()) {
      return books;
    }

    const query = search.toLowerCase();
    return books.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.category?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [books, search]);

  const stats = useMemo(() => {
    const total = books.length;
    const available = books.reduce((sum, book) => sum + book.availableCopies, 0);
    return { total, available };
  }, [books]);

  return (
    <div className="relative min-h-screen pb-28">
      <header className="px-6 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/70">Halo, selamat datang</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              MeetRead Library
            </h1>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold">
            {(sessionUser?.name ?? "MeetRead")
              .split(" ")
              .map((part) => part.charAt(0).toUpperCase())
              .slice(0, 2)
              .join("")}
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5">
          <p className="text-xs uppercase tracking-widest text-white/60">Statistik</p>
          <div className="mt-4 flex items-center justify-between text-white">
            <div>
              <p className="text-sm text-white/70">Total Koleksi</p>
              <p className="text-xl font-semibold">{stats.total} Buku</p>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div>
              <p className="text-sm text-white/70">Eksemplar Tersedia</p>
              <p className="text-xl font-semibold">{stats.available}</p>
            </div>
          </div>
        </div>
      </header>

      <section className="mt-6 flex-1 px-6">
        <div className="space-y-4">
          <div className="relative">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul, penulis, atau kategori…"
              className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-11 text-sm text-white placeholder-white/60 focus:border-white/30 focus:outline-none"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
              <MagnifierIcon />
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">
              Rekomendasi Untukmu
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {filteredBooks.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/70">
                  Buku yang kamu cari belum tersedia. Coba kata kunci lain ya!
                </div>
              ) : (
                filteredBooks.map((book) => (
                  <Link
                    key={book.id}
                    href={`/books/${book.id}`}
                    className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 transition hover:border-white/20 hover:bg-white/10"
                  >
                    <div className="flex gap-4">
                      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                        {book.coverImageUrl ? (
                          <Image
                            src={book.coverImageUrl}
                            alt={book.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                            No Cover
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <h3 className="text-base font-semibold text-white">{book.title}</h3>
                          <p className="text-xs text-white/60">oleh {book.author}</p>
                          {book.description && (
                            <p className="mt-2 line-clamp-2 text-xs text-white/60">{book.description}</p>
                          )}
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                          <span className="rounded-full bg-white/10 px-3 py-1">
                            {book.category ?? "Umum"}
                          </span>
                          <span>
                            Tersedia{" "}
                            <strong className="text-white">
                              {book.availableCopies}
                            </strong>{" "}
                            / {book.totalCopies}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MagnifierIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-2.6-2.6" strokeLinecap="round" />
    </svg>
  );
}
