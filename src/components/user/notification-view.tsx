"use client";

import Link from "next/link";

import type { BorrowRequestStatus, NotificationType } from "@prisma/client";

import { formatDate } from "@/lib/intl-format";

type NotificationEntry = {
  id: number;
  status: BorrowRequestStatus;
  type: NotificationType;
  message: string | null;
  createdAt: string;
  book: {
    id: number;
    title: string;
  };
};

type NotificationViewProps = {
  notifications: NotificationEntry[];
};

const STATUS_META: Record<
  Extract<NotificationType, "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED" | "EXTENDED">,
  { title: string; accent: string; defaultMessage: string }
> = {
  APPROVED: {
    title: "Permintaan disetujui",
    accent: "from-emerald-50 via-emerald-50 to-white border-emerald-200",
    defaultMessage: "Pemilik menyetujui permintaanmu. Hubungi mereka untuk penjemputan.",
  },
  REJECTED: {
    title: "Permintaan ditolak",
    accent: "from-rose-50 via-rose-50 to-white border-rose-200",
    defaultMessage: "Permintaanmu tidak dapat diproses oleh pemilik.",
  },
  CANCELLED: {
    title: "Permintaan dibatalkan",
    accent: "from-slate-50 via-slate-50 to-white border-slate-200",
    defaultMessage: "Permintaan dibatalkan oleh sistem atau pemilik.",
  },
  RETURNED: {
    title: "Peminjaman selesai",
    accent: "from-sky-50 via-sky-50 to-white border-sky-200",
    defaultMessage: "Terima kasih sudah mengembalikan buku tepat waktu.",
  },
  EXTENDED: {
    title: "Jatuh tempo diperpanjang",
    accent: "from-indigo-50 via-indigo-50 to-white border-indigo-200",
    defaultMessage: "Pemilik memperpanjang durasi peminjaman. Perhatikan tanggal baru.",
  },
};

export function NotificationView({ notifications }: NotificationViewProps) {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Pemberitahuan</p>
          <h1 className="text-2xl font-semibold text-slate-900">Notifikasi Terbaru</h1>
          <p className="text-sm text-slate-500">Catatan status peminjaman buku yang kamu ajukan.</p>
        </div>
        <Link
          href="/beranda"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-500 shadow-sm shadow-slate-100 transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          ← Kembali ke Beranda
        </Link>
      </header>

      <section className="mx-auto mt-8 space-y-4 max-w-4xl">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
            Belum ada notifikasi. Saat pemilik memproses permintaanmu, kabar terbaru akan muncul di sini.
          </div>
        ) : (
          notifications.map((notification) => {
            if (!(notification.type in STATUS_META)) {
              return null;
            }
            const meta = STATUS_META[notification.type as keyof typeof STATUS_META];
            return (
              <div
                key={notification.id}
                className={`rounded-3xl border bg-gradient-to-br ${meta.accent} p-5 text-slate-800 shadow-sm shadow-slate-100`}
              >
                <p className="text-sm text-slate-500">{formatDate(notification.createdAt)}</p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  Permintaan "{notification.book.title}" {meta.title.toLowerCase()}.
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {notification.message?.trim().length ? notification.message : meta.defaultMessage}
                </p>
                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/books/${notification.book.id}`}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-indigo-500 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    Lihat Buku
                  </Link>
                  <Link
                    href="/permintaan"
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50"
                  >
                    Lihat Timeline
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
