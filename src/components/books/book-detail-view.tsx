"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type DetailBook = {
  id: number;
  title: string;
  author: string;
  description: string;
  category: string;
  coverImageUrl: string;
  totalCopies: number;
  availableCopies: number;
  publishedYear: number | null;
  createdAt: string;
  lendable: boolean;
  status: "AVAILABLE" | "PENDING" | "RESERVED" | "BORROWED" | "UNAVAILABLE";
  ownerName: string;
  ownerPhone: string;
  borrowerName: string;
  dueDate: string | null;
  lastRequesterName: string;
  lastRequestStatus?: "PENDING" | "APPROVED";
};

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  joinedAt?: Date;
};

type BookDetailViewProps = {
  book: DetailBook;
  sessionUser: SessionUser | null;
};

export function BookDetailView({ book, sessionUser }: BookDetailViewProps) {
  const router = useRouter();
  const isAuthenticated = Boolean(sessionUser);
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const copiesSummary = useMemo(() => {
    const borrowed = book.totalCopies - book.availableCopies;
    return {
      borrowed,
      availablePercent: Math.max(
        0,
        Math.min(100, Math.round((book.availableCopies / book.totalCopies) * 100)),
      ),
    };
  }, [book.availableCopies, book.totalCopies]);

  const borrowerInfo = useMemo(() => {
    if (book.borrowerName) {
      return {
        name: book.borrowerName,
        due: book.dueDate
          ? new Date(book.dueDate).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : null,
      };
    }

    if (book.lastRequesterName) {
      return {
        name: book.lastRequesterName,
        due: null,
      };
    }

    return null;
  }, [book.borrowerName, book.dueDate, book.lastRequesterName]);

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      router.push(`/login?from=pinjam&book=${book.id}`);
      return;
    }

    if (!book.lendable || book.status !== "AVAILABLE") {
      if (borrowerInfo) {
        setFeedback(
          borrowerInfo.due
            ? `Buku ini sedang diproses oleh ${borrowerInfo.name} hingga ${borrowerInfo.due}.`
            : `Buku ini sedang diproses oleh ${borrowerInfo.name}.`,
        );
      } else if (book.lastRequesterName) {
        setFeedback(`Permintaan peminjaman sedang diproses untuk ${book.lastRequesterName}.`);
      } else {
        setFeedback("Buku ini belum tersedia untuk dipinjam saat ini.");
      }
      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);
      const response = await fetch("/api/borrow/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: book.id }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal mengajukan peminjaman.");
      }

      if (result.data?.whatsappUrl) {
        window.open(result.data.whatsappUrl, "_blank", "noopener");
      }

      setFeedback("Permintaan peminjaman dikirim. Silakan lanjutkan percakapan lewat WhatsApp.");
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Gagal mengajukan peminjaman.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta: Record<
    DetailBook["status"],
    { label: string; badgeClass: string; helpText?: string }
  > = {
    AVAILABLE: {
      label: "Tersedia",
      badgeClass: "bg-emerald-400/15 text-emerald-100 border border-emerald-300/40",
    },
    PENDING: {
      label: "Menunggu Konfirmasi",
      badgeClass: "bg-amber-300/20 text-amber-100 border border-amber-200/40",
      helpText: "Permintaan sedang diproses oleh pemilik.",
    },
    RESERVED: {
      label: "Dipesan",
      badgeClass: "bg-sky-300/20 text-sky-100 border border-sky-200/40",
      helpText: "Buku sudah dipesan oleh pengguna lain.",
    },
    BORROWED: {
      label: "Sedang Dipinjam",
      badgeClass: "bg-rose-400/25 text-rose-100 border border-rose-300/50",
      helpText: "Menunggu pengembalian dari peminjam.",
    },
    UNAVAILABLE: {
      label: "Tidak Dipinjamkan",
      badgeClass: "bg-white/10 text-white/60 border border-white/10",
      helpText: "Pemilik sedang menonaktifkan peminjaman.",
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 pb-24 pt-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition hover:border-white/20 hover:bg-white/15"
          aria-label="Kembali"
        >
          ←
        </button>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-col items-center gap-6 px-6 pb-10 pt-8 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="relative h-48 w-32 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
              {book.coverImageUrl ? (
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-white/60">
                  Tidak ada sampul
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-semibold leading-tight text-white">{book.title}</h1>
                <p className="mt-1 text-sm text-white/60">oleh {book.author}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-white/80">
                <DetailBadge label="Kategori" value={book.category} />
                {book.publishedYear ? (
                  <DetailBadge label="Terbit" value={book.publishedYear.toString()} />
                ) : null}
                <DetailBadge
                  label="Total Eksemplar"
                  value={`${book.totalCopies}`}
                />
                <DetailBadge
                  label="Tersedia"
                  value={`${book.availableCopies} buku`}
                  variant={book.availableCopies > 0 ? "success" : "danger"}
                />
                <DetailBadge label="Status" value={statusMeta[book.status].label} />
              </div>
              {statusMeta[book.status].helpText && (
                <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/60">
                  {statusMeta[book.status].helpText}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-6 border-t border-white/5 px-6 py-8 sm:grid-cols-2">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Ketersediaan
              </h2>
              <p className="mt-3 text-2xl font-semibold text-white">
                {book.availableCopies} / {book.totalCopies}
              </p>
              <p className="mt-1 text-xs text-white/60">
                {copiesSummary.borrowed} buku sedang dipinjam
              </p>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-sky-400"
                  style={{ width: `${copiesSummary.availablePercent}%` }}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Informasi
              </h2>
              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {book.ownerName && (
                  <li>
                    <span className="text-white/50">Pemilik:</span> {book.ownerName}
                  </li>
                )}
                {!borrowerInfo && book.status === "BORROWED" && (
                  <li>
                    <span className="text-white/50">Peminjam:</span>{" "}
                    <span className="text-white/70">Belum dicatat.</span>
                  </li>
                )}
                {borrowerInfo && (
                  <li>
                    <span className="text-white/50">Peminjam:</span>{" "}
                    {borrowerInfo.due ? `${borrowerInfo.name} (hingga ${borrowerInfo.due})` : borrowerInfo.name}
                  </li>
                )}
              </ul>
            </section>
          </div>

          <section className="space-y-4 border-t border-white/5 px-6 py-8">
            <h2 className="text-lg font-semibold text-white">Sinopsis</h2>
            <p className="text-sm leading-relaxed text-white/70">
              {book.description || "Belum ada deskripsi untuk buku ini. Hubungi admin untuk menambahkan informasi lebih lanjut."}
            </p>
          </section>
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent" />

        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-3xl px-6 pb-8">
          {feedback && (
            <div className="mb-4 rounded-3xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80">
              {feedback}
            </div>
          )}
          <button
            type="button"
            onClick={handleBorrow}
            disabled={
              isSubmitting ||
              !book.lendable ||
              book.status !== "AVAILABLE" ||
              !book.ownerPhone
            }
            className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-4 text-sm font-semibold uppercase tracking-widest text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Mengirim..." : book.ownerPhone ? "Ajukan Pinjam" : "Pemilik belum menambahkan WhatsApp"}
          </button>
        </div>
      </main>
    </div>
  );
}

type DetailBadgeProps = {
  label: string;
  value: string;
  variant?: "default" | "success" | "danger";
};

function DetailBadge({ label, value, variant = "default" }: DetailBadgeProps) {
  const baseClass =
    "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest";

  const styles = {
    default: "border-white/10 bg-white/5 text-white/70",
    success: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
    danger: "border-rose-400/40 bg-rose-400/10 text-rose-100",
  } as const;

  return (
    <span className={`${baseClass} ${styles[variant]}`}>
      <span className="text-white/50">{label}:</span>
      <span className="text-white">{value}</span>
    </span>
  );
}
