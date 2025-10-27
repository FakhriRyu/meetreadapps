"use client";

import Link from "next/link";

import type { BorrowRequestStatus, NotificationType } from "@prisma/client";

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
    accent: "from-emerald-500/20 via-emerald-400/10 to-emerald-300/10 border-emerald-400/50",
    defaultMessage: "Pemilik menyetujui permintaanmu. Hubungi mereka untuk penjemputan.",
  },
  REJECTED: {
    title: "Permintaan ditolak",
    accent: "from-rose-500/20 via-rose-400/10 to-rose-300/10 border-rose-400/50",
    defaultMessage: "Permintaanmu tidak dapat diproses oleh pemilik.",
  },
  CANCELLED: {
    title: "Permintaan dibatalkan",
    accent: "from-white/20 via-white/10 to-white/5 border-white/30",
    defaultMessage: "Permintaan dibatalkan oleh sistem atau pemilik.",
  },
  RETURNED: {
    title: "Peminjaman selesai",
    accent: "from-sky-500/20 via-sky-400/10 to-sky-300/10 border-sky-400/40",
    defaultMessage: "Terima kasih sudah mengembalikan buku tepat waktu.",
  },
  EXTENDED: {
    title: "Jatuh tempo diperpanjang",
    accent: "from-indigo-500/20 via-indigo-400/10 to-sky-300/10 border-indigo-400/50",
    defaultMessage: "Pemilik memperpanjang durasi peminjaman. Perhatikan tanggal baru.",
  },
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export function NotificationView({ notifications }: NotificationViewProps) {
  return (
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Pemberitahuan</p>
          <h1 className="text-2xl font-semibold text-white">Notifikasi Terbaru</h1>
          <p className="text-sm text-white/70">Catatan status peminjaman buku yang kamu ajukan.</p>
        </div>
        <Link
          href="/beranda"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
        >
          ← Kembali ke Beranda
        </Link>
      </header>

      <section className="mt-8 space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
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
                className={`rounded-3xl border bg-gradient-to-br ${meta.accent} p-5 text-white shadow-lg shadow-black/20`}
              >
                <p className="text-sm text-white/70">{formatDate(notification.createdAt)}</p>
                <p className="mt-1 text-base font-semibold">
                  Permintaan "{notification.book.title}" {meta.title.toLowerCase()}.
                </p>
                <p className="mt-1 text-sm text-white/80">
                  {notification.message?.trim().length ? notification.message : meta.defaultMessage}
                </p>
                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/books/${notification.book.id}`}
                    className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white/60 hover:bg-white/10"
                  >
                    Lihat Buku
                  </Link>
                  <Link
                    href="/permintaan"
                    className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80 transition hover:border-white/30 hover:bg-white/10"
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
