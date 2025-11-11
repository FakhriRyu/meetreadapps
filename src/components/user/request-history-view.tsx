import Image from "next/image";
import Link from "next/link";

import type { BookStatus, BorrowRequestStatus } from "@prisma/client";

import { formatDate, formatTime } from "@/lib/intl-format";

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
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    description: "Pemilik sedang meninjau permintaanmu.",
    accent: "from-amber-50 via-orange-50 to-white",
  },
  APPROVED: {
    label: "Disetujui",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    description: "Pemilik sudah menyetujui peminjaman.",
    accent: "from-emerald-50 via-teal-50 to-white",
  },
  REJECTED: {
    label: "Ditolak",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    description: "Permintaanmu tidak dapat diproses.",
    accent: "from-rose-50 via-pink-50 to-white",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
    description: "Permintaan dibatalkan sistem atau pemilik.",
    accent: "from-slate-50 via-slate-50 to-white",
  },
  RETURNED: {
    label: "Selesai",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    description: "Buku sudah dikembalikan.",
    accent: "from-sky-50 via-cyan-50 to-white",
  },
};

export function RequestHistoryView({ requests }: RequestHistoryViewProps) {
  const stats = requests.reduce(
    (acc, request) => {
      acc.total += 1;
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
    },
  );

  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Riwayat Peminjaman</p>
            <h1 className="text-2xl font-semibold text-slate-900">Permintaan Saya</h1>
            <p className="text-sm text-slate-500">
              Pantau progres permintaan peminjaman yang kamu ajukan di MeetRead.
            </p>
          </div>
          <Link
            href="/profil"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-500 shadow-sm shadow-slate-100 transition hover:border-indigo-200 hover:bg-indigo-50"
          >
            ← Kembali ke Profil
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total Permintaan" value={stats.total} accent="from-emerald-50 via-sky-50 to-white" />
          <StatCard label="Menunggu Konfirmasi" value={stats.pending} accent="from-amber-50 via-orange-50 to-white" />
          <StatCard label="Sedang Dipinjam" value={stats.active} accent="from-cyan-50 via-emerald-50 to-white" />
        </section>

        <section className="space-y-4">
          {requests.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
              Kamu belum pernah mengajukan peminjaman. Cari buku menarik di tab <strong>Pinjam</strong> dan ajukan
              permintaan pertamamu!
            </div>
          ) : (
            requests.map((request) => <RequestCard key={request.id} request={request} />)
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-gradient-to-br ${accent} p-5 text-slate-800 shadow-sm shadow-slate-100`}>
      <p className="text-xs uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 text-slate-600 shadow-sm shadow-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-12 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {request.book.coverImageUrl ? (
              <Image src={request.book.coverImageUrl} alt={request.book.title} fill sizes="48px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No Cover</div>
            )}
          </div>
          <div>
            <Link
              href={`/books/${request.book.id}`}
              className="text-base font-semibold text-slate-900 transition hover:text-indigo-500"
            >
              {request.book.title}
            </Link>
            <p className="text-xs text-slate-500">Pemilik: {request.book.ownerName}</p>
          </div>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-4 grid gap-4 text-xs text-slate-600 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Status Buku</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{meta.description}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-slate-500">Batas Pengembalian</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">{dueDateLabel}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Timeline</p>
        <div className="mt-4 space-y-4">
          {timeline.map((step, index) => (
            <div key={`${request.id}-step-${index}`} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                    step.active ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {index + 1}
                </span>
                {index < timeline.length - 1 && <span className="mt-1 h-full w-px bg-slate-200" />}
              </div>
              <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <span className="text-[11px] text-slate-500">{step.timeLabel}</span>
                </div>
                <p className="mt-2 leading-relaxed text-slate-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/books/${request.book.id}`}
          className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50"
        >
          Lihat Buku
        </Link>
        {request.status === "APPROVED" && request.whatsappUrl && (
          <a
            href={request.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600"
          >
            Hubungi Pemilik
          </a>
        )}
      </div>
    </div>
  );
}
