"use client";

import Image from "next/image";
import Link from "next/link";

import type { Book } from "@prisma/client";

type CollectionListProps = {
  collections: Book[];
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  deletingId?: number | null;
};

export function CollectionList({ collections, onEdit, onDelete, deletingId }: CollectionListProps) {
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
        <article
          key={book.id}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10"
        >
          <div className="flex gap-4">
            <Link
              href={`/books/${book.id}`}
              className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10 transition hover:border-emerald-300/60 hover:shadow-lg hover:shadow-emerald-400/20"
            >
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
            </Link>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <Link
                    href={`/books/${book.id}`}
                    className="text-base font-semibold text-white underline-offset-4 transition hover:text-emerald-200 hover:underline"
                  >
                    {book.title}
                  </Link>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      book.lendable ? "bg-emerald-400/20 text-emerald-100" : "bg-white/10 text-white/60"
                    }`}
                  >
                    {book.lendable ? "Siap Dipinjamkan" : "Tidak Dipinjamkan"}
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
                  Tersedia <strong className="text-white">{book.availableCopies}</strong> / {book.totalCopies}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs">
            <Link
              href={`/books/${book.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 px-4 py-2 font-semibold text-emerald-200 transition hover:border-emerald-200 hover:bg-emerald-400/10"
            >
              Detail
              <span aria-hidden>→</span>
            </Link>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(book)}
                className="rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(book)}
                disabled={deletingId === book.id}
                className="rounded-full border border-rose-300/60 px-4 py-2 font-semibold text-rose-200 transition hover:border-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === book.id ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
