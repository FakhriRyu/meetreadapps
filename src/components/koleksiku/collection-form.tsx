"use client";

import { useState } from "react";

type CollectionFormProps = {
  onSubmit: (payload: CollectionPayload) => Promise<void>;
  onClose: () => void;
  isSubmitting?: boolean;
  initialData?: CollectionPayload;
  submitLabel?: string;
};

export type CollectionPayload = {
  title: string;
  author: string;
  category?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  lendable: boolean;
  totalCopies: number;
  availableCopies: number;
};

const emptyState: CollectionPayload = {
  title: "",
  author: "",
  category: null,
  description: null,
  coverImageUrl: null,
  lendable: true,
  totalCopies: 1,
  availableCopies: 1,
};

const normalizeText = (value: string | null | undefined) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export function CollectionForm({ onSubmit, onClose, isSubmitting, initialData, submitLabel }: CollectionFormProps) {
  const [formState, setFormState] = useState<CollectionPayload>(initialData ?? emptyState);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof CollectionPayload) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const rawValue = event.target.value;
    if (event.target.type === "number") {
      const numericValue = rawValue === "" ? 0 : Number(rawValue);
      setFormState((prev) => ({ ...prev, [field]: numericValue as never }));
      return;
    }

    setFormState((prev) => ({ ...prev, [field]: rawValue as never }));
  };

  const handleCheckbox = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, lendable: event.target.checked }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (formState.availableCopies > formState.totalCopies) {
      setError("Eksemplar tersedia tidak boleh melebihi total eksemplar");
      return;
    }

    try {
      await onSubmit({
        ...formState,
        category: normalizeText(formState.category),
        description: normalizeText(formState.description),
        coverImageUrl: normalizeText(formState.coverImageUrl),
      });
      setFormState(emptyState);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-white/80">
          Judul Buku
          <input
            value={formState.title}
            onChange={handleChange("title")}
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
            placeholder="Misal: Laskar Pelangi"
          />
        </label>
        <label className="text-sm text-white/80">
          Penulis
          <input
            value={formState.author}
            onChange={handleChange("author")}
            required
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
            placeholder="Misal: Andrea Hirata"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-white/80">
          Kategori
          <input
            value={formState.category ?? ""}
            onChange={handleChange("category")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
            placeholder="Fiksi, Bisnis, dll"
          />
        </label>
        <label className="text-sm text-white/80">
          URL Sampul (opsional)
          <input
            value={formState.coverImageUrl ?? ""}
            onChange={handleChange("coverImageUrl")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
            placeholder="https://..."
          />
        </label>
      </div>
      <label className="text-sm text-white/80">
        Deskripsi
        <textarea
          value={formState.description ?? ""}
          onChange={handleChange("description")}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
          placeholder="Ceritakan sedikit tentang keadaan buku atau catatan khusus."
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-white/80">
          Total Eksemplar
          <input
            type="number"
            min={1}
            value={formState.totalCopies}
            onChange={handleChange("totalCopies")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
          />
        </label>
        <label className="text-sm text-white/80">
          Eksemplar Tersedia
          <input
            type="number"
            min={0}
            value={formState.availableCopies}
            onChange={handleChange("availableCopies")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
          />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm text-white/80">
        <input
          type="checkbox"
          checked={formState.lendable}
          onChange={handleCheckbox}
          className="h-4 w-4 rounded border-white/20 bg-white/10 text-emerald-400 focus:ring-emerald-300"
        />
        Izinkan koleksi ini dipinjamkan
      </label>

      {error && (
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan..." : submitLabel ?? (initialData ? "Simpan Perubahan" : "Simpan Koleksi")}
        </button>
      </div>
    </form>
  );
}
