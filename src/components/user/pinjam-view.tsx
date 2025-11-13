"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Book } from "@prisma/client";
import { openWhatsApp } from "@/lib/whatsapp";

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

const STATUS_META: Record<
  Book["status"],
  { label: string; badgeClass: string; helpText?: string }
> = {
  AVAILABLE: {
    label: "Tersedia",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    helpText: "Permintaan sedang diproses oleh pemilik.",
  },
  RESERVED: {
    label: "Dipesan",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    helpText: "Buku sudah dipesan oleh pengguna lain.",
  },
  BORROWED: {
    label: "Sedang Dipinjam",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    helpText: "Menunggu pengembalian dari peminjam.",
  },
  UNAVAILABLE: {
    label: "Tidak Dipinjamkan",
    badgeClass: "bg-slate-100 text-slate-500 border border-slate-200",
    helpText: "Pemilik sedang menonaktifkan peminjaman.",
  },
};

export function PinjamView({ books, sessionUser, pageInfo }: PinjamViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(pageInfo.query);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [confirmingBook, setConfirmingBook] = useState<Book | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const isAuthenticated = Boolean(sessionUser);

  const handleBorrowClick = (book: Book) => {
    if (!isAuthenticated) {
      window.location.assign(`/login?from=pinjam&book=${book.id}`);
      return;
    }

    if (book.status !== "AVAILABLE") {
      setFeedback("Buku sedang tidak tersedia untuk dipinjam.");
      return;
    }

    setFeedback(null);
    setConfirmingBook(book);
  };

  const submitBorrowRequest = async () => {
    if (!confirmingBook) {
      return;
    }

    try {
      setRequestingId(confirmingBook.id);
      setFeedback(null);
      const response = await fetch("/api/borrow/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: confirmingBook.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal mengajukan peminjaman.");
      }

      if (result.data?.whatsappUrl) openWhatsApp(result.data.whatsappUrl);

      setFeedback("Permintaan peminjaman dikirim. Silakan lanjutkan percakapan lewat WhatsApp.");
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Gagal mengajukan peminjaman.");
    } finally {
      setRequestingId(null);
      setConfirmingBook(null);
    }
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
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      {!isAuthenticated && (
        <div className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Masuk terlebih dahulu untuk mengajukan peminjaman. Kamu masih bisa melihat daftar buku dan langkah peminjaman.
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <MagnifierIcon className="h-5 w-5 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari judul, kategori, atau penulis…"
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600"
          >
            Cari
          </button>
        </div>
        {search && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              const params = new URLSearchParams(searchParams.toString());
              params.delete("query");
              params.delete("page");
              router.push(`/pinjam?${params.toString()}`);
            }}
            className="mt-3 text-xs font-semibold text-indigo-500 underline-offset-4 hover:text-indigo-600"
          >
            Reset pencarian
          </button>
        )}
      </form>

      {feedback && (
        <div className="mt-6 rounded-3xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-sm text-indigo-700">
          {feedback}
        </div>
      )}

      <section className="mt-8 space-y-4">
        <header className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Semua Buku</h3>
          <span className="text-xs text-slate-500">
            Halaman {pageInfo.currentPage} dari {pageInfo.totalPages} • Total {pageInfo.totalCount} buku
          </span>
        </header>

        <div className="space-y-3">
          {books.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
              Tidak ditemukan buku sesuai pencarian ini.
            </div>
          ) : (
            books.map((book) => (
              <Link
                key={`book-${book.id}`}
                href={`/books/${book.id}`}
                prefetch={false}
                className="group grid gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md grid-cols-[5rem_1fr]"
              >
                <div className="relative h-28 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  {book.coverImageUrl ? (
                    <Image
                      src={book.coverImageUrl}
                      alt={book.title}
                      fill
                      sizes="120px"
                      className="object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">Tanpa Sampul</div>
                  )}
                </div>
                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">{book.title}</h4>
                    <p className="text-xs text-slate-500">{book.author}</p>
                    <p className="text-xs text-slate-500">{book.category ?? "Umum"}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 font-semibold ${STATUS_META[book.status].badgeClass}`}>
                      {STATUS_META[book.status].label}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        handleBorrowClick(book);
                      }}
                      disabled={
                        book.status !== "AVAILABLE" ||
                        requestingId === book.id ||
                        confirmingBook?.id === book.id
                      }
                      className="inline-flex items-center rounded-full bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                    >
                      {requestingId === book.id ? "Mengirim..." : "Ajukan"}
                    </button>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {pageInfo.totalPages > 1 && (
          <nav className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => handlePageChange(pageInfo.currentPage - 1)}
              disabled={pageInfo.currentPage <= 1}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Sebelumnya
            </button>

            {paginationPages[0] > 1 && (
              <>
                <PageButton page={1} active={pageInfo.currentPage === 1} onClick={handlePageChange} />
                {paginationPages[0] > 2 && <span className="px-1 text-slate-400">…</span>}
              </>
            )}

            {paginationPages.map((page) => (
              <PageButton key={`page-${page}`} page={page} active={pageInfo.currentPage === page} onClick={handlePageChange} />
            ))}

            {paginationPages[paginationPages.length - 1] < pageInfo.totalPages && (
              <>
                {paginationPages[paginationPages.length - 1] < pageInfo.totalPages - 1 && <span className="px-1 text-slate-400">…</span>}
                <PageButton page={pageInfo.totalPages} active={pageInfo.currentPage === pageInfo.totalPages} onClick={handlePageChange} />
              </>
            )}

            <button
              type="button"
              onClick={() => handlePageChange(pageInfo.currentPage + 1)}
              disabled={pageInfo.currentPage >= pageInfo.totalPages}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              Selanjutnya
            </button>
          </nav>
        )}
      </section>

      {confirmingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-indigo-100">
            <h3 className="text-lg font-semibold">Teruskan Lewat WhatsApp?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Kamu akan diarahkan ke WhatsApp untuk menghubungi pemilik buku{" "}
              <span className="font-semibold">{confirmingBook.title}</span>. Setelah kamu melanjutkan, status buku
              akan berubah menjadi menunggu konfirmasi.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Jika memilih tidak, permintaan tidak dikirim dan status buku tetap seperti semula.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingBook(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={submitBorrowRequest}
                disabled={requestingId === confirmingBook.id}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestingId === confirmingBook.id ? "Mengirim..." : "Lanjut ke WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
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
          ? "border-indigo-400 bg-indigo-500 text-white shadow-sm shadow-indigo-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-600"
      }`}
    >
      {page}
    </button>
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
