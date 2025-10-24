"use client";

import { useEffect, useState } from "react";

import type { Book } from "@prisma/client";

import { CollectionForm, type CollectionPayload } from "./collection-form";
import { CollectionList } from "./collection-list";

type KoleksikuViewProps = {
  collections: Book[];
};

export function KoleksikuView({ collections }: KoleksikuViewProps) {
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
        lendable: editingItem.lendable,
        totalCopies: editingItem.totalCopies,
        availableCopies: editingItem.availableCopies,
        status: editingItem.status,
      }
    : undefined;

  return (
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Koleksiku</h1>
          <p className="text-sm text-white/70">Kelola buku milikmu dan atur status peminjaman.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300"
        >
          Tambah Koleksi
        </button>
      </header>

      <section className="mt-6 space-y-4">
        <CollectionList collections={items} onEdit={openEditModal} onDelete={handleDelete} deletingId={deletingId} />
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingItem ? "Edit Buku Koleksi" : "Tambah Buku Koleksi"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/70">
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
