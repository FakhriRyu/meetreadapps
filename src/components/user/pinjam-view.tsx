"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Book } from "@prisma/client";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type PageInfo = {
  totalCount: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  query: string;
};

type PinjamViewProps = {
  books: Book[];
  sessionUser: SessionUser | null;
  pageInfo: PageInfo;
};

export function PinjamView({ books, sessionUser, pageInfo }: PinjamViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(pageInfo.query);
  const isAuthenticated = Boolean(sessionUser);

  const handleBorrowClick = (bookId: number) => {
    if (!isAuthenticated) {
      window.location.assign(`/login?from=pinjam&book=${bookId}`);
      return;
    }

    alert(`Fitur peminjaman sedang dikembangkan. Buku ID: ${bookId}`);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search.trim()) {
      params.set("query", search.trim());
    } else {
      params.delete("query");
    }
    params.delete("page");
    router.push(`/pinjam?${params.toString()}`);
  };

  const paginationPages = useMemo(() => {
    const windowSize = 3;
    const start = Math.max(1, pageInfo.currentPage - windowSize);
    const end = Math.min(pageInfo.totalPages, pageInfo.currentPage + windowSize);
    const pages: number[] = [];
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }, [pageInfo.currentPage, pageInfo.totalPages]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    router.push(`/pinjam?${params.toString()}`);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 px-6 pb-24 pt-10 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      {!isAuthenticated && (
        <div className="relative mb-5 rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-white/80">
          Masuk terlebih dahulu untuk mengajukan peminjaman. Kamu masih bisa melihat daftar buku dan langkah peminjaman.
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative mt-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari apa?"
          className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-28 text-sm text-white placeholder-white/60 focus:border-white/30 focus:outline-none"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
          <button
            type="button"
            onClick={() => {
              setSearch("");
              const params = new URLSearchParams(searchParams.toString());
              params.delete("query");
              params.delete("page");
              router.push(`/pinjam?${params.toString()}`);
            }}
            className="text-xs font-semibold text-white/60 underline-offset-4 transition hover:text-white"
          >
            Reset
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/70 transition hover:border-white/20 hover:text-white"
          >
            <MagnifierIcon />
            Cari
          </button>
        </div>
      </form>

      <section className="relative mt-8 space-y-4">
        <header className="flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
            Semua Buku
          </h3>
          <span className="text-xs text-white/50">
            Halaman {pageInfo.currentPage} dari {pageInfo.totalPages}
          </span>
        </header>

        <div className="space-y-3">
          {books.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/70">
              Tidak ditemukan buku sesuai pencarian ini.
            </div>
          ) : (
            books.map((book) => (
              <Link
                key={`book-${book.id}`}
                href={`/books/${book.id}`}
                className="group grid grid-cols-[5rem_1fr] gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 transition hover:border-white/20 hover:bg-white/10 sm:grid-cols-[6rem_1fr]"
              >
                <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:h-32">
                  {book.coverImageUrl ? (
                    <Image
                      src={book.coverImageUrl}
                      alt={book.title}
                      fill
                      sizes="96px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                      Tanpa Sampul
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-white group-hover:text-emerald-200">{book.title}</h4>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          book.availableCopies > 0 ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/60"
                        }`}
                      >
                        {book.availableCopies > 0 ? "Tersedia" : "Habis"}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">
                      {book.author} • {book.category ?? "Umum"}
                    </p>
                    {book.description && (
                      <p className="line-clamp-2 text-xs text-white/60">{book.description}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>
                      Stok:{" "}
                      <strong className="text-white/80">
                        {book.availableCopies}/{book.totalCopies}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        handleBorrowClick(book.id);
                      }}
                      className="rounded-full border border-emerald-300/60 px-4 py-2 font-semibold text-emerald-200 transition hover:border-emerald-200 hover:bg-emerald-400/20"
                    >
                      Ajukan Pinjam
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {pageInfo.totalPages > 1 && (
          <nav className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold text-white/70">
            <button
              type="button"
              onClick={() => handlePageChange(pageInfo.currentPage - 1)}
              disabled={pageInfo.currentPage <= 1}
              className="rounded-full border border-white/10 px-3 py-1 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Sebelumnya
            </button>

            {paginationPages[0] > 1 && (
              <>
                <PageButton page={1} active={pageInfo.currentPage === 1} onClick={handlePageChange} />
                {paginationPages[0] > 2 && <span className="px-1 text-white/40">…</span>}
              </>
            )}

            {paginationPages.map((page) => (
              <PageButton
                key={`page-${page}`}
                page={page}
                active={pageInfo.currentPage === page}
                onClick={handlePageChange}
              />
            ))}

            {paginationPages[paginationPages.length - 1] < pageInfo.totalPages && (
              <>
                {paginationPages[paginationPages.length - 1] < pageInfo.totalPages - 1 && (
                  <span className="px-1 text-white/40">…</span>
                )}
                <PageButton
                  page={pageInfo.totalPages}
                  active={pageInfo.currentPage === pageInfo.totalPages}
                  onClick={handlePageChange}
                />
              </>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(pageInfo.currentPage + 1)}
              disabled={pageInfo.currentPage >= pageInfo.totalPages}
              className="rounded-full border border-white/10 px-3 py-1 transition hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Selanjutnya
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}

function PageButton({
  page,
  active,
  onClick,
}: {
  page: number;
  active: boolean;
  onClick: (page: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(page)}
      className={`rounded-full border px-3 py-1 transition ${
        active
          ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
      }`}
    >
      {page}
    </button>
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
