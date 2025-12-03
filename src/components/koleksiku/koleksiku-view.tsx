// @ts-nocheck - Temporary: Supabase returns ISO strings while types expect Date
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { type Book } from "@/types/enums";

import { CollectionForm, type CollectionPayload } from "./collection-form";
import { CollectionList } from "./collection-list";

type CollectionBook = Book & {
  averageRating?: number;
};

type KoleksikuViewProps = {
  collections: CollectionBook[];
  currentPage: number;
  totalPages: number;
};

export function KoleksikuView({ collections, currentPage, totalPages }: KoleksikuViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<Book[]>(collections);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Book | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setItems(collections);
  }, [collections]);

  const handleSubmit = async (payload: CollectionPayload) => {
    setSubmitting(true);
    try {
      let response: Response;
      if (editingItem) {
        response = await fetch(`/api/collections/${Number(editingItem.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan koleksi");
      }

      const updatedBook: Book = result.data;

      if (editingItem) {
        setItems((prev) => prev.map((book) => (book.id === editingItem.id ? updatedBook : book)));
      } else {
        setItems((prev) => [updatedBook, ...prev]);
      }

      setModalOpen(false);
      setEditingItem(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    const confirmed = window.confirm(`Hapus koleksi "${book.title}"?`);
    if (!confirmed) return;

    setDeletingId(book.id);
    try {
      const response = await fetch(`/api/collections/${Number(book.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menghapus koleksi");
      }
      setItems((prev) => prev.filter((item) => item.id !== book.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal menghapus koleksi");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingItem(book);
    setModalOpen(true);
  };

  const initialData: CollectionPayload | undefined = editingItem
    ? {
      title: editingItem.title,
      author: editingItem.author,
      category: editingItem.category,
      description: editingItem.description,
      coverImageUrl: editingItem.coverImageUrl,
      isbn: editingItem.isbn ?? null,
      publishedYear: editingItem.publishedYear ?? null,
      lendable: editingItem.lendable,
      totalCopies: editingItem.totalCopies,
      availableCopies: editingItem.availableCopies,
      status: editingItem.status,
    }
    : undefined;

  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Koleksiku</h1>
            <p className="text-sm text-slate-500">Kelola buku milikmu dan atur status peminjaman.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600"
          >
            Tambah Koleksi
          </button>
        </header>

        <section className="space-y-4">
          <CollectionList collections={items} onEdit={openEditModal} onDelete={handleDelete} deletingId={deletingId} />
        </section>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pb-8">
            <button
              onClick={() => router.push(`/koleksiku?page=${currentPage - 1}`)}
              disabled={currentPage <= 1}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <span className="text-sm font-medium text-slate-600">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => router.push(`/koleksiku?page=${currentPage + 1}`)}
              disabled={currentPage >= totalPages}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl shadow-slate-200 sm:max-h-[calc(100vh-6.5rem)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingItem ? "Edit Buku Koleksi" : "Tambah Buku Koleksi"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Bagikan koleksi buku pribadimu agar teman dapat meminjam, atau simpan hanya untuk catatan pribadi.
            </p>
            <div className="mt-5">
              <CollectionForm
                key={editingItem ? editingItem.id : "create"}
                onSubmit={handleSubmit}
                onClose={() => {
                  setModalOpen(false);
                  setEditingItem(null);
                }}
                isSubmitting={isSubmitting}
                initialData={initialData}
                submitLabel={editingItem ? "Simpan Perubahan" : "Simpan Koleksi"}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
