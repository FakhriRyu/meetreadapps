"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BookStatus = "AVAILABLE" | "PENDING" | "RESERVED" | "BORROWED" | "UNAVAILABLE";

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
  isbn?: string | null;
  publishedYear?: number | null;
  lendable: boolean;
  totalCopies: number;
  availableCopies: number;
  status?: BookStatus;
};

const emptyState: CollectionPayload = {
  title: "",
  author: "",
  category: null,
  description: null,
  coverImageUrl: null,
  isbn: null,
  publishedYear: null,
  lendable: true,
  totalCopies: 1,
  availableCopies: 1,
  status: undefined,
};

const normalizeText = (value: string | null | undefined) => {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export function CollectionForm({ onSubmit, onClose, isSubmitting, initialData, submitLabel }: CollectionFormProps) {
  const [formState, setFormState] = useState<CollectionPayload>(initialData ?? emptyState);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(-1);
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const isEditing = Boolean(initialData);
  const optionalNumericFields = useMemo(() => new Set<keyof CollectionPayload>(["publishedYear"]), []);
  const currentYear = useMemo(() => new Date().getFullYear() + 1, []);

  const statusOptions = useMemo(
    () => [
      { value: "AVAILABLE", label: "Tersedia" },
      { value: "PENDING", label: "Menunggu Konfirmasi" },
      { value: "RESERVED", label: "Dipesan" },
      { value: "BORROWED", label: "Sedang Dipinjam" },
      { value: "UNAVAILABLE", label: "Tidak Dipinjamkan" },
    ],
    [],
  );

  // Fetch available categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (response.ok) {
          const result = await response.json();
          setAvailableCategories(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };
    void fetchCategories();
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node) &&
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter categories based on input
  useEffect(() => {
    const categoryValue = formState.category?.toLowerCase() || "";
    if (categoryValue.length > 0) {
      const filtered = availableCategories.filter((cat) =>
        cat.toLowerCase().startsWith(categoryValue)
      );
      setFilteredCategories(filtered);
      setSelectedCategoryIndex(-1);
    } else {
      setFilteredCategories([]);
    }
  }, [formState.category, availableCategories]);

  const handleChange =
    (field: keyof CollectionPayload) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const rawValue = event.target.value;
      if (event.target.type === "number") {
        if (optionalNumericFields.has(field)) {
          const numericValue = rawValue === "" ? null : Number(rawValue);
          setFormState((prev) => ({ ...prev, [field]: numericValue as never }));
        } else {
          const numericValue = rawValue === "" ? 0 : Number(rawValue);
          setFormState((prev) => ({ ...prev, [field]: numericValue as never }));
        }
        return;
      }

      setFormState((prev) => ({ ...prev, [field]: rawValue as never }));
    };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormState((prev) => ({ ...prev, category: value }));
    setShowCategoryDropdown(true);
  };

  const handleCategorySelect = (category: string) => {
    setFormState((prev) => ({ ...prev, category }));
    setShowCategoryDropdown(false);
    setSelectedCategoryIndex(-1);
  };

  const handleCategoryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showCategoryDropdown || filteredCategories.length === 0) {
      if (event.key === "ArrowDown" && filteredCategories.length > 0) {
        setShowCategoryDropdown(true);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedCategoryIndex((prev) =>
          prev < filteredCategories.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedCategoryIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        event.preventDefault();
        if (selectedCategoryIndex >= 0 && selectedCategoryIndex < filteredCategories.length) {
          handleCategorySelect(filteredCategories[selectedCategoryIndex]);
        }
        break;
      case "Escape":
        setShowCategoryDropdown(false);
        setSelectedCategoryIndex(-1);
        break;
    }
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
        isbn: normalizeText(formState.isbn),
        publishedYear: formState.publishedYear ?? null,
        status: formState.status,
      });
      setFormState(emptyState);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-24 text-slate-900 sm:pb-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Judul Buku
          <input
            value={formState.title}
            onChange={handleChange("title")}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Misal: Laskar Pelangi"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Penulis
          <input
            value={formState.author}
            onChange={handleChange("author")}
            required
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Misal: Andrea Hirata"
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative text-sm font-medium text-slate-700">
          Kategori
          <input
            ref={categoryInputRef}
            value={formState.category ?? ""}
            onChange={handleCategoryChange}
            onKeyDown={handleCategoryKeyDown}
            onFocus={() => {
              if (filteredCategories.length > 0) {
                setShowCategoryDropdown(true);
              }
            }}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Sejarah"
            autoComplete="off"
          />
          {showCategoryDropdown && filteredCategories.length > 0 && (
            <div
              ref={categoryDropdownRef}
              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200"
            >
              {filteredCategories.map((category, index) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition ${index === selectedCategoryIndex
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-700 hover:bg-slate-50"
                    } ${index === 0 ? "rounded-t-2xl" : ""} ${index === filteredCategories.length - 1 ? "rounded-b-2xl" : ""
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}
        </label>
        <label className="text-sm font-medium text-slate-700">
          URL Sampul (opsional)
          <input
            value={formState.coverImageUrl ?? ""}
            onChange={handleChange("coverImageUrl")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="https://..."
          />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          ISBN (opsional)
          <input
            value={formState.isbn ?? ""}
            onChange={handleChange("isbn")}
            maxLength={32}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Contoh: 9786020633176"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Tahun Terbit (opsional)
          <input
            type="number"
            inputMode="numeric"
            min={1000}
            max={currentYear}
            value={formState.publishedYear ?? ""}
            onChange={handleChange("publishedYear")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="Contoh: 2024"
          />
        </label>
      </div>
      <label className="text-sm font-medium text-slate-700">
        Deskripsi
        <textarea
          value={formState.description ?? ""}
          onChange={handleChange("description")}
          rows={3}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="Ceritakan sedikit tentang keadaan buku atau catatan khusus."
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Total Eksemplar
          <input
            type="number"
            min={1}
            value={formState.totalCopies}
            onChange={handleChange("totalCopies")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Eksemplar Tersedia
          <input
            type="number"
            min={0}
            value={formState.availableCopies}
            onChange={handleChange("availableCopies")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </label>
      </div>
      <label className="flex items-center gap-3 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={formState.lendable}
          onChange={handleCheckbox}
          className="h-4 w-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-200"
        />
        Izinkan koleksi ini dipinjamkan
      </label>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {isEditing && (
        <label className="block text-sm font-medium text-slate-700">
          Status Peminjaman
          <select
            value={formState.status ?? "AVAILABLE"}
            onChange={handleChange("status")}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Menyimpan..." : submitLabel ?? (initialData ? "Simpan Perubahan" : "Simpan Koleksi")}
        </button>
      </div>
    </form>
  );
}
