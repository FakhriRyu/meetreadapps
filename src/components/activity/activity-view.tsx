"use client";

import { useState } from "react";
import Link from "next/link";
import { BookStatus, BorrowRequestStatus, NotificationType, type Book, type BorrowRequest } from "@/types/enums";
import { formatDate } from "@/lib/intl-format";

type RequestWithRelations = BorrowRequest & {
    book: Pick<
        Book,
        "id" | "title" | "status" | "dueDate" | "availableCopies" | "totalCopies" | "lendable" | "ownerId"
    > & {
        owner?: {
            name: string;
        } | null;
    };
    requester: {
        id: number;
        name: string;
        email: string;
        phoneNumber: string | null;
    };
};

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

type ActivityViewProps = {
    incomingRequests: RequestWithRelations[];
    outgoingRequests: RequestWithRelations[];
    notifications: NotificationEntry[];
    activeLoans: RequestWithRelations[]; // Placeholder for now
};

type Tab = "peminjaman" | "persetujuan" | "pengembalian" | "notifikasi";

const INCOMING_STATUS_META: Record<
    Extract<BorrowRequestStatus, "PENDING" | "APPROVED">,
    { label: string; badgeClass: string; helpText: string }
> = {
    PENDING: {
        label: "Menunggu Konfirmasi",
        badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
        helpText: "Segera tentukan apakah buku akan dipinjamkan.",
    },
    APPROVED: {
        label: "Sedang Dipinjam",
        badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        helpText: "Buku sedang dipinjam dan menunggu pengembalian.",
    },
};

const OUTGOING_STATUS_META: Record<
    BorrowRequestStatus,
    { label: string; badgeClass: string; helpText: string }
> = {
    PENDING: {
        label: "Menunggu Konfirmasi",
        badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
        helpText: "Permintaanmu sedang ditinjau oleh pemilik buku.",
    },
    APPROVED: {
        label: "Disetujui",
        badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        helpText: "Permintaan disetujui. Silakan ambil buku sesuai kesepakatan.",
    },
    REJECTED: {
        label: "Ditolak",
        badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
        helpText: "Maaf, permintaanmu ditolak oleh pemilik buku.",
    },
    CANCELLED: {
        label: "Dibatalkan",
        badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
        helpText: "Permintaan ini telah dibatalkan.",
    },
    RETURNED: {
        label: "Selesai",
        badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
        helpText: "Peminjaman telah selesai dan buku dikembalikan.",
    },
};

const NOTIFICATION_STATUS_META: Record<
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

const formatDateInput = (value: Date) => value.toISOString().split("T")[0];

export function ActivityView({ incomingRequests, outgoingRequests, notifications }: ActivityViewProps) {
    const [activeTab, setActiveTab] = useState<Tab>("persetujuan");
    const [loanRequests, setLoanRequests] = useState<RequestWithRelations[]>(incomingRequests);

    // Action State for Modals
    const [actionState, setActionState] = useState<{ type: "approve" | "reject" | "complete" | "extend"; request: RequestWithRelations } | null>(null);
    const [actionDueDate, setActionDueDate] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [actionError, setActionError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Detail Modal State
    const [detailRequest, setDetailRequest] = useState<RequestWithRelations | null>(null);

    const openActionModal = (type: "approve" | "reject" | "complete" | "extend", request: RequestWithRelations) => {
        setActionState({ type, request });
        setActionMessage("");
        setActionError(null);
        if (type === "approve" || type === "extend") {
            const suggestedDate = request.book.dueDate
                ? formatDateInput(new Date(request.book.dueDate))
                : formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            setActionDueDate(suggestedDate);
        } else {
            setActionDueDate("");
        }
    };

    const closeActionModal = () => {
        setActionState(null);
        setActionDueDate("");
        setActionMessage("");
        setActionError(null);
        setActionLoading(false);
    };

    const handleActionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!actionState) return;

        const { request: targetRequest, type } = actionState;
        const payload: Record<string, unknown> = {};

        if (type === "approve" || type === "extend") {
            if (!actionDueDate) {
                setActionError("Tanggal pengembalian wajib diisi.");
                return;
            }
            payload.dueDate = actionDueDate;
        }
        if (actionMessage.trim().length > 0) {
            payload.message = actionMessage.trim();
        }

        const endpoint = `/api/borrow/requests/${targetRequest.id}/${type}`;
        setActionLoading(true);
        setActionError(null);

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error ?? "Gagal memproses permintaan.");
            }

            // Optimistic update (simplified)
            setLoanRequests((prev) => prev.filter((req) => req.id !== targetRequest.id));
            closeActionModal();
        } catch (error) {
            setActionError(error instanceof Error ? error.message : "Terjadi kesalahan.");
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
            <div className="mx-auto flex w-full max-w-md flex-col gap-6">
                <header>
                    <h1 className="text-2xl font-semibold text-slate-900">Aktivitas</h1>
                    <p className="text-sm text-slate-500">Pantau status peminjaman dan pengembalian buku.</p>
                </header>

                <div className="flex rounded-full bg-white p-1 shadow-sm shadow-slate-200 overflow-x-auto">
                    {(["peminjaman", "persetujuan", "pengembalian", "notifikasi"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition ${activeTab === tab
                                ? "bg-indigo-500 text-white shadow-sm"
                                : "text-slate-500 hover:bg-slate-50"
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                <section className="space-y-4">
                    {activeTab === "persetujuan" && (
                        <>
                            {loanRequests.length === 0 ? (
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                                    Tidak ada permintaan persetujuan saat ini.
                                </div>
                            ) : (
                                loanRequests.map((request) => {
                                    const statusKey = request.status === BorrowRequestStatus.APPROVED ? "APPROVED" : "PENDING";
                                    const meta = INCOMING_STATUS_META[statusKey];
                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-100"
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                                                        <p className="text-xs text-slate-500">Permintaan oleh {request.requester.name}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setDetailRequest(request)}
                                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 transition"
                                                        title="Lihat Detail"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                                                    {meta.label}
                                                </span>

                                                <div className="mt-2 grid gap-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Diajukan</span>
                                                        <span className="font-medium text-slate-800">{formatDate(request.createdAt)}</span>
                                                    </div>
                                                    {request.message && (
                                                        <div className="mt-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                                                            "{request.message}"
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4 flex gap-2">
                                                    <button
                                                        onClick={() => openActionModal("approve", request)}
                                                        className="flex-1 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600"
                                                    >
                                                        Setujui
                                                    </button>
                                                    <button
                                                        onClick={() => openActionModal("reject", request)}
                                                        className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                                                    >
                                                        Tolak
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}

                    {activeTab === "peminjaman" && (
                        <>
                            {outgoingRequests.length === 0 ? (
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                                    Kamu belum mengajukan peminjaman buku apapun.
                                </div>
                            ) : (
                                outgoingRequests.map((request) => {
                                    const meta = OUTGOING_STATUS_META[request.status];
                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-100"
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                                                        <p className="text-xs text-slate-500">
                                                            {meta.label} • {formatDate(request.createdAt)}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setDetailRequest(request)}
                                                        className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 transition"
                                                        title="Lihat Detail"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                                                    {meta.label}
                                                </span>

                                                <p className="text-xs text-slate-500">{meta.helpText}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}

                    {activeTab === "pengembalian" && (
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                            Fitur pengembalian buku akan segera hadir.
                        </div>
                    )}

                    {activeTab === "notifikasi" && (
                        <>
                            {notifications.length === 0 ? (
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                                    Belum ada notifikasi.
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    if (!(notification.type in NOTIFICATION_STATUS_META)) {
                                        return null;
                                    }
                                    const meta = NOTIFICATION_STATUS_META[notification.type as keyof typeof NOTIFICATION_STATUS_META];

                                    // Determine which tab to switch to based on notification type or context
                                    // For now, we'll assume most notifications are about outgoing requests (Peminjaman)
                                    // except if we are the owner (which would be incoming requests/Persetujuan)
                                    // But since notifications are for the current user:
                                    // - If I requested a book (outgoing), notifications are APPROVED/REJECTED/etc. -> Go to Peminjaman
                                    // - If someone requested my book (incoming), I get a notification? (Not implemented yet in this view, but assuming)
                                    // Based on current logic, these are mostly for outgoing requests.
                                    const targetTab: Tab = "peminjaman";

                                    return (
                                        <div
                                            key={notification.id}
                                            className={`rounded-3xl border bg-gradient-to-br ${meta.accent} p-5 text-slate-800 shadow-sm shadow-slate-100`}
                                        >
                                            <p className="text-sm text-slate-500">{formatDate(notification.createdAt)}</p>
                                            <p className="mt-1 text-base font-semibold text-slate-900">
                                                Permintaan &quot;{notification.book.title}&quot; {meta.title.toLowerCase()}.
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
                                                <button
                                                    onClick={() => setActiveTab(targetTab)}
                                                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50"
                                                >
                                                    Lihat Timeline
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}
                </section>
            </div>

            {/* Action Modal */}
            {actionState && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">
                            {actionState.type === "approve" ? "Setujui Peminjaman" : "Tolak Peminjaman"}
                        </h3>

                        <form onSubmit={handleActionSubmit} className="space-y-4">
                            {actionState.type === "approve" && (
                                <label className="block text-sm text-slate-600">
                                    Tanggal Pengembalian
                                    <input
                                        type="date"
                                        min={formatDateInput(new Date())}
                                        value={actionDueDate}
                                        onChange={(e) => setActionDueDate(e.target.value)}
                                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        required
                                    />
                                </label>
                            )}

                            <label className="block text-sm text-slate-600">
                                Catatan (Opsional)
                                <textarea
                                    value={actionMessage}
                                    onChange={(e) => setActionMessage(e.target.value)}
                                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    rows={3}
                                />
                            </label>

                            {actionError && (
                                <p className="text-xs text-rose-600">{actionError}</p>
                            )}

                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={closeActionModal}
                                    className="flex-1 rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 rounded-full bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                                >
                                    {actionLoading ? "Memproses..." : "Konfirmasi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detailRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900">Detail Permintaan</h3>
                            <button onClick={() => setDetailRequest(null)} className="text-slate-400 hover:text-slate-600">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-16 w-12 rounded-lg bg-slate-100 object-cover overflow-hidden relative border border-slate-200">
                                    {/* Placeholder for book cover if not available */}
                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 font-bold">IMG</div>
                                </div>
                                <div>
                                    <p className="font-semibold text-slate-900 line-clamp-1">{detailRequest.book.title}</p>
                                    <p className="text-xs text-slate-500">
                                        {detailRequest.status === BorrowRequestStatus.APPROVED ? "Dipinjam dari" : "Milik"} {detailRequest.book.owner?.name ?? "Pemilik"}
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Status</span>
                                    <span className={`font-semibold ${detailRequest.status === BorrowRequestStatus.APPROVED ? "text-emerald-600" :
                                        detailRequest.status === BorrowRequestStatus.REJECTED ? "text-rose-600" :
                                            "text-amber-600"
                                        }`}>
                                        {OUTGOING_STATUS_META[detailRequest.status]?.label || detailRequest.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Diajukan Tanggal</span>
                                    <span className="text-slate-900">{formatDate(detailRequest.createdAt)}</span>
                                </div>
                                {detailRequest.ownerDecisionAt && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Direspon Tanggal</span>
                                        <span className="text-slate-900">{formatDate(detailRequest.ownerDecisionAt)}</span>
                                    </div>
                                )}
                                {detailRequest.book.dueDate && detailRequest.status === BorrowRequestStatus.APPROVED && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Tenggat Waktu</span>
                                        <span className="text-slate-900">{formatDate(detailRequest.book.dueDate)}</span>
                                    </div>
                                )}
                            </div>

                            {(detailRequest.message || detailRequest.ownerMessage) && (
                                <div className="border-t border-slate-100 pt-3 space-y-2">
                                    {detailRequest.message && (
                                        <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                                            <p className="font-semibold text-slate-900 mb-1">Pesan Peminjam:</p>
                                            "{detailRequest.message}"
                                        </div>
                                    )}
                                    {detailRequest.ownerMessage && (
                                        <div className="rounded-xl bg-indigo-50 p-3 text-xs text-indigo-700">
                                            <p className="font-semibold text-indigo-900 mb-1">Pesan Pemilik:</p>
                                            "{detailRequest.ownerMessage}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
