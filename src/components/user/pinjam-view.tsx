"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Book } from "@prisma/client";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type PinjamViewProps = {
  books: Book[];
  sessionUser: SessionUser | null;
};

export function PinjamView({ books, sessionUser }: PinjamViewProps) {
  const popularBooks = useMemo(() => books.slice(0, 4), [books]);
  const isAuthenticated = Boolean(sessionUser);

  const handleBorrowClick = (bookId: number) => {
    if (!isAuthenticated) {
      window.location.assign(`/login?from=pinjam&book=${bookId}`);
      return;
    }

    alert(`Fitur peminjaman sedang dikembangkan. Buku ID: ${bookId}`);
  };

  return (
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      {!isAuthenticated && (
        <div className="mb-5 rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
          Masuk terlebih dahulu untuk mengajukan peminjaman. Kamu masih bisa melihat
          daftar buku dan langkah peminjaman dari sini.
        </div>
      )}

      <div className="rounded-3xl border border-emerald-400/40 bg-emerald-400/15 p-5 text-white">
        <h2 className="text-lg font-semibold">Langkah Meminjam Buku</h2>
        <ol className="mt-3 space-y-2 text-sm text-white/80">
          <li>1. Temukan buku favoritmu dari katalog.</li>
          <li>2. Klik tombol &quot;Ajukan Peminjaman&quot; di halaman detail.</li>
          <li>3. Datang ke perpustakaan untuk mengambil buku dalam 24 jam.</li>
        </ol>
      </div>

      <div className="mt-6 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
          Pilihan Populer
        </h3>
        <div className="space-y-3">
          {popularBooks.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
              Buku populer belum tersedia.
            </div>
          ) : (
            popularBooks.map((book) => (
              <div
                key={`borrow-${book.id}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{book.title}</p>
                  <p className="text-xs text-white/60">oleh {book.author}</p>
                  <Link
                    href={`/books/${book.id}`}
                    className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 underline-offset-2 transition hover:text-emerald-200 hover:underline"
                  >
                    Lihat Detail
                    <span aria-hidden>→</span>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => handleBorrowClick(book.id)}
                  className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:bg-emerald-300"
                >
                  {isAuthenticated ? "Ajukan" : "Masuk untuk Pinjam"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
