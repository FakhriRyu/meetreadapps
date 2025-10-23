"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { Book } from "@prisma/client";
import type { BookFormData } from "@/lib/validators/book";

type BookFormState = {
  title: string;
  author: string;
  category: string;
  isbn: string;
  publishedYear: string;
  totalCopies: string;
  availableCopies: string;
  coverImageUrl: string;
  description: string;
};

const emptyFormState: BookFormState = {
  title: "",
  author: "",
  category: "",
  isbn: "",
  publishedYear: "",
  totalCopies: "1",
  availableCopies: "1",
  coverImageUrl: "",
  description: "",
};

const toFormState = (book: Book): BookFormState => ({
  title: book.title ?? "",
  author: book.author ?? "",
  category: book.category ?? "",
  isbn: book.isbn ?? "",
  publishedYear: book.publishedYear?.toString() ?? "",
  totalCopies: book.totalCopies.toString(),
  availableCopies: book.availableCopies.toString(),
  coverImageUrl: book.coverImageUrl ?? "",
  description: book.description ?? "",
});

const toPayload = (state: BookFormState): BookFormData => ({
  title: state.title,
  author: state.author,
  category: state.category,
  isbn: state.isbn,
  publishedYear: state.publishedYear ? Number(state.publishedYear) : undefined,
  totalCopies: Number(state.totalCopies || "0"),
  availableCopies: Number(state.availableCopies || "0"),
  coverImageUrl: state.coverImageUrl,
  description: state.description,
});

type BookAdminPanelProps = {
  initialBooks: Book[];
};

export function BookAdminPanel({ initialBooks }: BookAdminPanelProps) {
  const [books, setBooks] = useState<Book[]>(initialBooks);
  const [search, setSearch] = useState("");
  const [formState, setFormState] = useState<BookFormState>(emptyFormState);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState<Book | null>(null);

  const filteredBooks = useMemo(() => {
    if (!search.trim()) {
      return books;
    }

    const query = search.toLowerCase();
    return books.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.category?.toLowerCase().includes(query) ?? false) ||
        (book.isbn?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [books, search]);

  const stats = useMemo(() => {
    const total = books.length;
    const totalCopies = books.reduce((sum, book) => sum + book.totalCopies, 0);
    const available = books.reduce((sum, book) => sum + book.availableCopies, 0);
    const loaned = totalCopies - available;
    const categories = new Set(books.map((book) => book.category).filter(Boolean));
    return {
      total,
      totalCopies,
      available,
      loaned,
      categories: Array.from(categories),
    };
  }, [books]);

  const resetForm = () => {
    setFormState(emptyFormState);
    setEditingBook(null);
  };

  const openCreateModal = () => {
    resetForm();
    setStatus(null);
    setModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setFormState(toFormState(book));
    setEditingBook(book);
    setStatus(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
    setStatus(null);
    if (!editingBook) {
      resetForm();
    }
  };

  const updateBooksState = (next: Book) => {
    setBooks((current) => {
      const exists = current.some((book) => book.id === next.id);
      if (exists) {
        return current.map((book) => (book.id === next.id ? next : book));
      }

      return [next, ...current];
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setStatus(null);

    const payload = toPayload(formState);
    if (payload.availableCopies > payload.totalCopies) {
      setStatus({
        type: "error",
        message: "Eksemplar tersedia tidak boleh melebihi total eksemplar.",
      });
      setSubmitting(false);
      return;
    }

    try {
      const endpoint = editingBook ? `/api/books/${editingBook.id}` : "/api/books";
      const method = editingBook ? "PUT" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Terjadi kesalahan.");
      }

      updateBooksState(result.data);
      setStatus({
        type: "success",
        message: editingBook ? "Data buku berhasil diperbarui." : "Buku baru berhasil ditambahkan.",
      });

      if (!editingBook) {
        resetForm();
      }

      setModalOpen(false);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    setStatus(null);
    setConfirmingDelete(book);
  };

  const confirmDelete = async () => {
    if (!confirmingDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/books/${confirmingDelete.id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menghapus buku.");
      }

      setBooks((current) => current.filter((book) => book.id !== confirmingDelete.id));
      setStatus({ type: "success", message: "Buku berhasil dihapus." });
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setConfirmingDelete(null);
    }
  };

  const modalTitle = editingBook ? "Edit Buku" : "Tambah Buku";

  const handleNumberInput = (name: keyof Pick<BookFormState, "totalCopies" | "availableCopies" | "publishedYear">) => (value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Koleksi Buku" value={stats.total.toString()} accent="from-rose-500/90 via-rose-400 to-orange-300" />
        <StatCard
          label="Eksemplar Tersedia"
          value={stats.available.toString()}
          accent="from-emerald-500 via-emerald-400 to-teal-300"
          subtitle={`${stats.loaned} dipinjam`}
        />
        <StatCard label="Eksemplar Total" value={stats.totalCopies.toString()} accent="from-blue-500 via-violet-500 to-indigo-400" />
        <StatCard label="Kategori Aktif" value={stats.categories.length.toString()} accent="from-amber-400 via-amber-300 to-yellow-200" />
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Daftar Buku</h2>
            <p className="text-sm text-white/70">Kelola data buku, stok, dan informasi peminjaman.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:min-w-[220px]">
              <input
                className="w-full rounded-full border border-white/10 bg-white/10 px-4 py-2 pr-10 text-sm text-white placeholder-white/60 backdrop-blur focus:border-white/30 focus:outline-none"
                placeholder="Cari judul, penulis, atau ISBN…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
                <MagnifierIcon />
              </span>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="group inline-flex items-center justify-center rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-2 focus:ring-offset-emerald-900/40"
            >
              <span className="mr-2 text-lg leading-none text-emerald-950/80 transition group-hover:text-emerald-900">＋</span>
              Tambah Buku
            </button>
          </div>
        </div>

        {status && (
          <div
            className={`mt-6 rounded-2xl border p-4 text-sm font-medium ${
              status.type === "success"
                ? "border-emerald-500/40 bg-emerald-400/20 text-emerald-50"
                : "border-rose-500/40 bg-rose-400/20 text-rose-50"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/10 text-left text-xs font-semibold uppercase tracking-wide text-white/70">
              <tr>
                <th className="px-6 py-4">Buku</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4">Stok</th>
                <th className="px-6 py-4">Tahun</th>
                <th className="px-6 py-4">ISBN</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-white/80">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-white/60">
                    Belum ada buku yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr key={book.id} className="transition hover:bg-white/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/10 shadow-inner shadow-black/30">
                          {book.coverImageUrl ? (
                            <Image
                              src={book.coverImageUrl}
                              alt={book.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-white/40">
                              No Cover
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{book.title}</p>
                          <p className="text-xs text-white/60">{book.author}</p>
                          {book.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-white/50">{book.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {book.category ? (
                        <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white">
                          {book.category}
                        </span>
                      ) : (
                        <span className="text-xs text-white/40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-white">
                        {book.availableCopies} <span className="text-white/60">/ {book.totalCopies}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-emerald-400 transition-all"
                          style={{ width: `${Math.min(100, (book.availableCopies / book.totalCopies) * 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {book.publishedYear ? (
                        <span>{book.publishedYear}</span>
                      ) : (
                        <span className="text-xs text-white/40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {book.isbn ? (
                        <code className="rounded-lg bg-white/10 px-2 py-1 text-xs text-white/80">{book.isbn}</code>
                      ) : (
                        <span className="text-xs text-white/40">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(book)}
                          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(book)}
                          className="rounded-full border border-rose-300/60 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:border-rose-200 hover:bg-rose-400/20"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur">
          <div className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-800 p-8 shadow-2xl shadow-black/30">
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:bg-white/20"
            >
              <span className="text-lg leading-none">✕</span>
            </button>
            <h3 className="text-xl font-semibold text-white">{modalTitle}</h3>
            <p className="mt-1 text-sm text-white/70">
              Isi seluruh informasi penting agar petugas perpustakaan mudah memantau peminjaman.
            </p>

            <form
              className="mt-6 grid gap-4 text-sm text-white/70 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              <FormField
                label="Judul"
                required
                value={formState.title}
                onChange={(value) => setFormState((prev) => ({ ...prev, title: value }))}
              />
              <FormField
                label="Penulis"
                required
                value={formState.author}
                onChange={(value) => setFormState((prev) => ({ ...prev, author: value }))}
              />
              <FormField
                label="Kategori"
                placeholder="Contoh: Fiksi, Teknis, Referensi"
                value={formState.category}
                onChange={(value) => setFormState((prev) => ({ ...prev, category: value }))}
              />
              <FormField
                label="ISBN"
                placeholder="Jika ada"
                value={formState.isbn}
                onChange={(value) => setFormState((prev) => ({ ...prev, isbn: value }))}
              />
              <FormField
                label="Tahun Terbit"
                placeholder="Contoh: 2024"
                value={formState.publishedYear}
                onChange={handleNumberInput("publishedYear")}
              />
              <FormField
                label="URL Sampul"
                placeholder="https://…"
                value={formState.coverImageUrl}
                onChange={(value) => setFormState((prev) => ({ ...prev, coverImageUrl: value }))}
              />
              <FormField
                label="Total Eksemplar"
                required
                value={formState.totalCopies}
                onChange={handleNumberInput("totalCopies")}
              />
              <FormField
                label="Eksemplar Tersedia"
                required
                value={formState.availableCopies}
                onChange={handleNumberInput("availableCopies")}
              />
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wide text-white/60">
                  Deskripsi
                </label>
                <textarea
                  rows={4}
                  value={formState.description}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, description: event.target.value }))
                  }
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/30 focus:outline-none"
                  placeholder="Ringkasan singkat untuk membantu pemilihan pembaca…"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-full border border-white/10 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 px-6 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:to-teal-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Menyimpan…" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl shadow-black/40">
            <h4 className="text-lg font-semibold">Hapus buku ini?</h4>
            <p className="mt-2 text-sm text-white/70">
              Buku <span className="font-semibold text-white">{confirmingDelete.title}</span> akan
              dihapus dan tidak dapat dipulihkan.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmingDelete(null)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-rose-500/40 transition hover:bg-rose-400"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  accent: string;
  subtitle?: string;
};

function StatCard({ label, value, accent, subtitle }: StatCardProps) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-5 text-white shadow-lg shadow-black/20 backdrop-blur`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-white/80">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      {subtitle && <p className="mt-1 text-xs text-white/80">{subtitle}</p>}
    </div>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
};

function FormField({ label, value, onChange, required, placeholder }: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-white/60">
        {label} {required && <span className="text-rose-200">*</span>}
      </span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/30 focus:outline-none"
        required={required}
      />
    </label>
  );
}

function MagnifierIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="20" y1="20" x2="16.65" y2="16.65" />
    </svg>
  );
}
