"use client";

import Image from "next/image";
import Link from "next/link";

import type { Book } from "@prisma/client";

import { formatDate, formatNumber } from "@/lib/intl-format";

type CollectionListProps = {
  collections: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  deletingId?: number | null;
};

const STATUS_META: Record<
  Book["status"],
  { label: string; badgeClass: string }
> = {
  AVAILABLE: {
    label: "Tersedia",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  },
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  RESERVED: {
    label: "Dipesan",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
  },
  BORROWED: {
    label: "Sedang Dipinjam",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
  },
  UNAVAILABLE: {
    label: "Tidak Dipinjamkan",
    badgeClass: "bg-slate-100 text-slate-500 border border-slate-200",
  },
};

export function CollectionList({ collections, onEdit, onDelete, deletingId }: CollectionListProps) {
  if (collections.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
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
          className="relative block overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md"
        >
          <div className="flex gap-4">
            <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              {book.coverImageUrl ? (
                <Image src={book.coverImageUrl} alt={book.title} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">No Cover</div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-base font-semibold text-slate-900">{book.title}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_META[book.status].badgeClass}`}>
                    {STATUS_META[book.status].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">oleh {book.author}</p>
                {book.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-slate-600">{book.description}</p>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
                <span className="rounded-full bg-slate-100 px-3 py-1">{book.category ?? "Umum"}</span>
                <span>
                  Tersedia{" "}
                  <strong className="text-slate-800">{formatNumber(book.availableCopies)}</strong> /{" "}
                  {formatNumber(book.totalCopies)}
                </span>
              </div>
              {book.status === "BORROWED" && book.dueDate && (
                <p className="mt-2 text-xs text-slate-500">
                  Estimasi kembali: <strong className="text-slate-700">{formatDate(book.dueDate)}</strong>
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
                className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
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
                className="rounded-full border border-rose-200 px-4 py-2 font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
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
