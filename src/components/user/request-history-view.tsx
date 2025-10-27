"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";

import type { BookStatus, BorrowRequestStatus } from "@prisma/client";

type HistoryRequest = {
  id: number;
  status: BorrowRequestStatus;
  message: string | null;
  ownerMessage: string | null;
  ownerDecisionAt: string | null;
  createdAt: string;
  updatedAt: string;
  whatsappUrl: string | null;
  book: {
    id: number;
    title: string;
    coverImageUrl: string | null;
    status: BookStatus;
    dueDate: string | null;
    ownerName: string;
  };
};

type RequestHistoryViewProps = {
  requests: HistoryRequest[];
};

const STATUS_META: Record<
  BorrowRequestStatus,
  { label: string; badgeClass: string; description: string; accent: string }
> = {
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "bg-amber-300/20 text-amber-100 border border-amber-200/40",
    description: "Pemilik sedang meninjau permintaanmu.",
    accent: "from-amber-500 via-orange-400 to-amber-300",
  },
  APPROVED: {
    label: "Disetujui",
    badgeClass: "bg-emerald-400/20 text-emerald-100 border border-emerald-200/40",
    description: "Pemilik sudah menyetujui peminjaman.",
    accent: "from-emerald-500 via-teal-400 to-emerald-300",
  },
  REJECTED: {
    label: "Ditolak",
    badgeClass: "bg-rose-400/20 text-rose-100 border border-rose-200/40",
    description: "Permintaanmu tidak dapat diproses.",
    accent: "from-rose-500 via-pink-500 to-rose-300",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "bg-white/10 text-white/70 border border-white/20",
    description: "Permintaan dibatalkan sistem atau pemilik.",
    accent: "from-slate-500 via-slate-600 to-slate-400",
  },
  RETURNED: {
    label: "Selesai",
    badgeClass: "bg-sky-400/20 text-sky-100 border border-sky-200/40",
    description: "Buku sudah dikembalikan.",
    accent: "from-sky-500 via-cyan-400 to-sky-300",
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

const formatTime = (value: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function RequestHistoryView({ requests }: RequestHistoryViewProps) {
  const stats = useMemo(() => {
    return requests.reduce(
      (acc, request) => {
        acc.total += 1;
        acc.byStatus[request.status] = (acc.byStatus[request.status] ?? 0) + 1;
        if (request.status === "APPROVED") acc.active += 1;
        if (request.status === "PENDING") acc.pending += 1;
        if (request.status === "RETURNED") acc.completed += 1;
        return acc;
      },
      {
        total: 0,
        pending: 0,
        active: 0,
        completed: 0,
        byStatus: {} as Record<BorrowRequestStatus, number>,
      },
    );
  }, [requests]);

  return (
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/50">Riwayat Peminjaman</p>
          <h1 className="text-2xl font-semibold text-white">Permintaan Saya</h1>
          <p className="text-sm text-white/70">
            Pantau progres permintaan peminjaman yang kamu ajukan di MeetRead.
          </p>
        </div>
        <Link
          href="/profil"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:bg-white/10"
        >
          ← Kembali ke Profil
        </Link>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="Total Permintaan" value={stats.total} accent="from-emerald-500 via-sky-500 to-blue-400" />
        <StatCard label="Menunggu Konfirmasi" value={stats.pending} accent="from-amber-500 via-orange-400 to-yellow-300" />
        <StatCard label="Sedang Dipinjam" value={stats.active} accent="from-cyan-500 via-emerald-400 to-lime-300" />
      </section>

      <section className="mt-8 space-y-4">
        {requests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/70">
            Kamu belum pernah mengajukan peminjaman. Cari buku menarik di tab <strong>Pinjam</strong> dan ajukan
            permintaan pertamamu!
          </div>
        ) : (
          requests.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-gradient-to-br ${accent} p-5 text-white shadow-lg`}>
      <p className="text-xs uppercase tracking-widest text-white/80">{label}</p>
      <p className="mt-3 text-3xl font-bold">{value}</p>
    </div>
  );
}

function RequestCard({ request }: { request: HistoryRequest }) {
  const meta = STATUS_META[request.status];
  const hasDecision = Boolean(request.ownerDecisionAt);
  const dueDateLabel =
    request.status === "APPROVED" || request.status === "RETURNED" ? formatDate(request.book.dueDate) : "-";

  const timeline: Array<{
    title: string;
    timestamp: string | null;
    timeLabel: string;
    description: string;
    active: boolean;
  }> = [
    {
      title: "Diajukan",
      timestamp: request.createdAt,
      timeLabel: `${formatDate(request.createdAt)} • ${formatTime(request.createdAt)}`,
      description: request.message ? `Catatanmu: “${request.message}”` : "Permintaan dikirim ke pemilik buku.",
      active: true,
    },
    {
      title:
        request.status === "PENDING"
          ? "Menunggu Keputusan"
          : request.status === "APPROVED"
            ? "Disetujui"
            : request.status === "REJECTED"
              ? "Ditolak"
              : request.status === "RETURNED"
                ? "Selesai"
                : "Dibatalkan",
      timestamp: request.ownerDecisionAt,
      timeLabel: hasDecision
        ? `${formatDate(request.ownerDecisionAt)} • ${formatTime(request.ownerDecisionAt)}`
        : "Belum ada keputusan",
      description:
        request.status === "APPROVED"
          ? request.ownerMessage
            ? `Pesan pemilik: “${request.ownerMessage}”`
            : "Hubungi pemilik untuk pengambilan buku."
          : request.status === "REJECTED"
            ? request.ownerMessage
              ? `Alasan: “${request.ownerMessage}”`
              : "Pemilik belum memberikan alasan."
            : request.status === "RETURNED"
              ? request.ownerMessage ?? "Terima kasih sudah mengembalikan buku tepat waktu."
              : request.status === "CANCELLED"
                ? request.ownerMessage ?? "Permintaan dibatalkan."
                : "Masih menunggu respon dari pemilik.",
      active: request.status !== "PENDING",
    },
  ];

  if (request.status === "APPROVED" || request.status === "RETURNED") {
    timeline.push({
      title: request.status === "APPROVED" ? "Jadwal Pengembalian" : "Pengembalian",
      timestamp: request.book.dueDate,
      timeLabel: dueDateLabel === "-" ? "Segera koordinasikan dengan pemilik." : `${dueDateLabel}`,
      description:
        request.status === "APPROVED"
          ? "Pastikan buku dikembalikan sebelum tanggal ini."
          : request.ownerMessage ?? "Peminjaman selesai.",
      active: request.status === "RETURNED",
    });
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/10">
            {request.book.coverImageUrl ? (
              <Image src={request.book.coverImageUrl} alt={request.book.title} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-white/60">No Cover</div>
            )}
          </div>
          <div>
            <Link
              href={`/books/${request.book.id}`}
              className="text-base font-semibold text-white transition hover:text-emerald-200"
            >
              {request.book.title}
            </Link>
            <p className="text-xs text-white/60">Pemilik: {request.book.ownerName}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-4 py-1 text-xs font-semibold ${meta.badgeClass}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-4 grid gap-4 text-xs text-white/70 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/50">Status Buku</p>
          <p className="mt-1 text-sm font-semibold text-white">{meta.description}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-white/50">Batas Pengembalian</p>
          <p className="mt-1 text-sm font-semibold text-white">{dueDateLabel}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-white/5 pt-5">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Timeline</p>
        <div className="mt-4 space-y-4">
          {timeline.map((step, index) => (
            <div key={`${request.id}-step-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    step.active ? "bg-emerald-400 text-emerald-950" : "bg-white/10 text-white/50"
                  }`}
                >
                  {index + 1}
                </span>
                {index < timeline.length - 1 && <span className="mt-1 h-full w-px bg-white/10" />}
              </div>
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <span className="text-[11px] text-white/60">{step.timeLabel}</span>
                </div>
                <p className="mt-2 leading-relaxed text-white/80">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/books/${request.book.id}`}
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-white/30 hover:bg-white/10"
        >
          Lihat Buku
        </Link>
        {request.status === "APPROVED" && request.whatsappUrl && (
          <a
            href={request.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:bg-emerald-300"
          >
            Hubungi Pemilik
          </a>
        )}
      </div>
    </div>
  );
}
