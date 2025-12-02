"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { formatDate, formatNumber } from "@/lib/intl-format";
import { openWhatsApp } from "@/lib/whatsapp";
import { ReviewList } from "@/components/reviews/review-list";
import { ReviewForm } from "@/components/reviews/review-form";

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
  ownerProfileImage: string | null;
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
  reviews: any[];
  totalReviews: number;
};

export function BookDetailView({ book, sessionUser, reviews, totalReviews }: BookDetailViewProps) {
  const router = useRouter();
  const isAuthenticated = Boolean(sessionUser);
  const [isSubmitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isReviewModalOpen, setReviewModalOpen] = useState(false);

  const [editingReview, setEditingReview] = useState<any | null>(null);

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const userHasReviewed = useMemo(() => {
    if (!sessionUser || !reviews) return false;
    return reviews.some((review) => review.user.id === sessionUser.id);
  }, [sessionUser, reviews]);

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
        due: book.dueDate ? formatDate(book.dueDate) : null,
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

  const showUnavailableFeedback = () => {
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
  };

  const handleBorrowClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?from=pinjam&book=${book.id}`);
      return;
    }

    if (!book.lendable || book.status !== "AVAILABLE") {
      showUnavailableFeedback();
      return;
    }

    setFeedback(null);
    setConfirmOpen(true);
  };

  const handleReviewClick = () => {
    if (!isAuthenticated) {
      router.push(`/login?from=books/${book.id}`);
      return;
    }
    setEditingReview(null);
    setReviewModalOpen(true);
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setReviewModalOpen(true);
  };

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      router.push(`/login?from=pinjam&book=${book.id}`);
      return;
    }

    if (!book.lendable || book.status !== "AVAILABLE") {
      showUnavailableFeedback();
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

      if (result.data?.whatsappUrl) openWhatsApp(result.data.whatsappUrl);

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
      badgeClass: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    },
    PENDING: {
      label: "Menunggu Konfirmasi",
      badgeClass: "bg-amber-50 text-amber-700 border border-amber-200",
      helpText: "Permintaan sedang diproses oleh pemilik.",
    },
    RESERVED: {
      label: "Dipesan",
      badgeClass: "bg-sky-50 text-sky-700 border border-sky-200",
      helpText: "Buku sudah dipesan oleh pengguna lain.",
    },
    BORROWED: {
      label: "Sedang Dipinjam",
      badgeClass: "bg-rose-50 text-rose-700 border border-rose-200",
      helpText: "Menunggu pengembalian dari peminjam.",
    },
    UNAVAILABLE: {
      label: "Tidak Dipinjamkan",
      badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
      helpText: "Pemilik sedang menonaktifkan peminjaman.",
    },
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f5f7ff] text-slate-900">
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.95);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes backdropFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 400ms ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 400ms ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 300ms ease-out forwards;
        }
        .animate-backdropFade {
          animation: backdropFade 200ms ease-out forwards;
        }
      `}</style>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 pb-24 pt-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
          aria-label="Kembali"
        >
          ←
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100 animate-slideUp">
          <div className="flex flex-col items-center gap-6 px-6 pb-10 pt-8 text-center">
            {/* Cover Image with Rating Overlay */}
            <div className="relative h-64 w-44 flex-shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md transition-transform duration-300 hover:scale-105" style={{ animationDelay: '0ms' }}>
              {book.coverImageUrl ? (
                <Image
                  src={book.coverImageUrl}
                  alt={book.title}
                  fill
                  sizes="176px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                  Tidak ada sampul
                </div>
              )}

              {/* Rating Overlay */}
              {reviews.length > 0 && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <svg className="h-3.5 w-3.5 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span>{averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Title & Author */}
            <div className="space-y-2 animate-slideUp" style={{ animationDelay: '100ms' }}>
              <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{book.title}</h1>
              <p className="text-base text-slate-500">oleh {book.author}</p>
            </div>

            {/* Owner Profile */}
            <div className="animate-slideUp" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-3 rounded-full border border-slate-100 bg-slate-50 px-4 py-2 pr-6 transition-colors hover:bg-slate-100">
                <div className="relative h-8 w-8 overflow-hidden rounded-full bg-indigo-100">
                  {book.ownerProfileImage ? (
                    <Image
                      src={book.ownerProfileImage}
                      alt={book.ownerName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-indigo-600">
                      {book.ownerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs text-slate-500">Pemilik Buku</p>
                  <p className="text-sm font-semibold text-slate-900">{book.ownerName}</p>
                </div>
              </div>
            </div>
          </div>

          <section className="space-y-4 border-t border-slate-100 px-6 py-8 animate-slideUp" style={{ animationDelay: '300ms' }}>
            <h2 className="text-lg font-semibold text-slate-900">Sinopsis</h2>
            <p className="text-sm leading-relaxed text-slate-600">
              {book.description || "Belum ada deskripsi untuk buku ini. Hubungi admin untuk menambahkan informasi lebih lanjut."}
            </p>
          </section>

          <section className="space-y-6 border-t border-slate-100 px-6 py-8 animate-slideUp" style={{ animationDelay: '350ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Ulasan Pembaca</h2>
            </div>
            <ReviewList
              reviews={reviews}
              sessionUser={sessionUser}
              onEdit={handleEditReview}
            />
            {totalReviews > 3 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => router.push(`/books/${book.id}/reviews`)}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition-all duration-200 hover:scale-105"
                >
                  Lihat semua {totalReviews} ulasan
                </button>
              </div>
            )}
          </section>
        </div>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-[#f5f7ff] via-[#f5f7ff]/80 to-transparent" />

        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-3xl px-6 pb-8">
          {feedback && (
            <div className="mb-4 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm shadow-slate-100">
              {feedback}
            </div>
          )}
          <div className="flex gap-3">
            {!userHasReviewed && (
              <button
                type="button"
                onClick={handleReviewClick}
                className="flex-1 rounded-full border border-indigo-200 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-widest text-indigo-600 shadow-lg shadow-indigo-100 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50 hover:scale-105 active:scale-95"
              >
                Tulis Review
              </button>
            )}
            <button
              type="button"
              onClick={handleBorrowClick}
              disabled={
                isSubmitting ||
                !book.lendable ||
                book.status !== "AVAILABLE" ||
                !book.ownerPhone
              }
              className="flex-[2] rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-4 text-sm font-semibold uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:from-indigo-400 hover:to-sky-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitting ? "Mengirim..." : book.ownerPhone ? "Ajukan Pinjam" : "Pemilik belum menambahkan WhatsApp"}
            </button>
          </div>
        </div>
      </main>

      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm animate-backdropFade">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-indigo-100 animate-scaleIn">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingReview ? "Edit Review" : "Tulis Review"}
              </h3>
              <button
                onClick={() => {
                  setReviewModalOpen(false);
                  setEditingReview(null);
                }}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all duration-200 hover:rotate-90"
              >
                ✕
              </button>
            </div>
            <ReviewForm
              bookId={book.id}
              onSuccess={() => {
                setReviewModalOpen(false);
                setEditingReview(null);
              }}
              initialData={editingReview}
            />
          </div>
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm animate-backdropFade">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-indigo-100 animate-scaleIn">
            <h3 className="text-lg font-semibold">Konfirmasi Pengajuan</h3>
            <p className="mt-2 text-sm text-slate-600">
              Kamu akan diarahkan ke WhatsApp untuk melanjutkan percakapan dengan pemilik buku. Jika setuju, status buku
              akan berubah menjadi menunggu konfirmasi.
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Pilih tidak jika belum ingin menghubungi lewat WhatsApp. Status buku tetap seperti semula.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 transition-all duration-200 hover:border-indigo-200 hover:text-indigo-600 hover:scale-105 active:scale-95"
              >
                Tidak
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  void handleBorrow();
                }}
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition-all duration-200 hover:from-indigo-400 hover:to-sky-400 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Mengirim..." : "Lanjut ke WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
