"use client";

import Image from "next/image";
import Link from "next/link";

import type { Book } from "@/types/enums";

import { formatDate, formatNumber } from "@/lib/intl-format";

type CollectionListProps = {
  collections: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  deletingId?: number | null;
};

export function CollectionList({ collections, onEdit, onDelete, deletingId }: CollectionListProps) {
  const getStatusMeta = (book: Book) => {
    const meta: Record<
      Book["status"],
      { label: string; badgeClass: string; description?: string }
    > = {
      AVAILABLE: {
        label: "Tersedia",
        badgeClass: "bg-emerald-400/20 text-emerald-100 border border-emerald-300/40",
      },
      PENDING: {
        label: "Menunggu Konfirmasi",
        badgeClass: "bg-amber-300/20 text-amber-100 border border-amber-200/40",
      },
      RESERVED: {
        label: "Dipesan",
        badgeClass: "bg-sky-300/20 text-sky-100 border border-sky-200/40",
      },
      BORROWED: {
        label: "Sedang Dipinjam",
        badgeClass: "bg-rose-400/20 text-rose-100 border border-rose-300/40",
      },
      UNAVAILABLE: {
        label: "Tidak Dipinjamkan",
        badgeClass: "bg-white/10 text-white/60 border border-white/10",
      },
    };

    return meta[book.status];
  };

  if (collections.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
        Kamu belum menambahkan buku apa pun. Tekan tombol &ldquo;Tambah Koleksi&rdquo; untuk memulai.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {collections.map((book) => (
        <Link
          key={book.id}
          href={`/books/${book.id}`}
          className="relative block overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10 transition hover:border-emerald-300/60 hover:bg-white/10"
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
                <div className="flex items-center justify-between">
                  <p className="text-base font-semibold text-white">{book.title}</p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusMeta(book).badgeClass}`}
                  >
                    {getStatusMeta(book).label}
                  </span>
                </div>
                <p className="text-xs text-white/60">oleh {book.author}</p>
                {book.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-white/60">{book.description}</p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                <span className="rounded-full bg-white/10 px-3 py-1">{book.category ?? "Umum"}</span>
                <span>
                  Tersedia{" "}
                  <strong className="text-white">{formatNumber(book.availableCopies)}</strong> /{" "}
                  {formatNumber(book.totalCopies)}
                </span>
              </div>
              {book.status === "BORROWED" && book.dueDate && (
                <p className="mt-2 text-xs text-white/60">
                  Estimasi kembali:{" "}
                  <strong className="text-white/80">{formatDate(book.dueDate)}</strong>
                </p>
              )}
            </div>
            <div className="flex flex-col justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onEdit(book);
                }}
                className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onDelete(book);
                }}
                disabled={deletingId === book.id}
                className="rounded-full border border-rose-300/60 px-4 py-2 font-semibold text-rose-200 transition hover:border-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === book.id ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
