"use client";

import { useState } from "react";

import { BookStatus, BorrowRequestStatus, type Book, type BorrowRequest } from "@/types/enums";
import { formatDate } from "@/lib/intl-format";

type RequestWithRelations = BorrowRequest & {
    dueDate: string | null;
    book: Pick<
        Book,
        "id" | "title" | "availableCopies" | "totalCopies" | "ownerId" | "coverImageUrl"
    > & {
        owner?: {
            name: string | null;
            phoneNumber?: string | null;
        } | null;
    };
    requester: {
        id: number;
        name: string | null;
        email: string;
        phoneNumber: string | null;
    };
};

type ActivityViewProps = {
    incomingRequests: RequestWithRelations[];
    outgoingRequests: RequestWithRelations[];
    activeLoans: RequestWithRelations[];
};

type Tab = "peminjaman" | "persetujuan" | "pengembalian";

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

const formatDateInput = (value: Date) => value.toISOString().split("T")[0];

export function ActivityView({ incomingRequests, outgoingRequests, activeLoans }: ActivityViewProps) {
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

    // Return Modal State
    const [returnRequest, setReturnRequest] = useState<RequestWithRelations | null>(null);

    const handleReturnRequest = (request: RequestWithRelations) => {
        setReturnRequest(request);
    };

    const handleConfirmReturn = () => {
        if (!returnRequest || !returnRequest.book.owner?.phoneNumber) return;

        const phoneNumber = returnRequest.book.owner.phoneNumber.replace(/\D/g, "");
        // Ensure phone number starts with country code (assuming ID +62)
        const formattedPhone = phoneNumber.startsWith("0")
            ? "62" + phoneNumber.slice(1)
            : phoneNumber.startsWith("62")
                ? phoneNumber
                : "62" + phoneNumber;

        const message = `Halo, saya ingin mengembalikan buku "${returnRequest.book.title}". Kapan dan di mana kita bisa bertemu?`;
        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, "_blank");
        setReturnRequest(null);
    };

    const openActionModal = (type: "approve" | "reject" | "complete" | "extend", request: RequestWithRelations) => {
        setActionState({ type, request });
        setActionMessage("");
        setActionError(null);
        if (type === "approve" || type === "extend") {
            const suggestedDate = request.dueDate
                ? formatDateInput(new Date(request.dueDate))
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
        // if (actionMessage.trim().length > 0) {
        //     payload.message = actionMessage.trim();
        // }

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
                    {(["peminjaman", "persetujuan", "pengembalian"] as const).map((tab) => (
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
                                    const isPending = request.status === BorrowRequestStatus.PENDING;

                                    const handleContactRequester = () => {
                                        if (!request.requester.phoneNumber) return;
                                        const phoneNumber = request.requester.phoneNumber.replace(/\D/g, "");
                                        const formattedPhone = phoneNumber.startsWith("0")
                                            ? "62" + phoneNumber.slice(1)
                                            : phoneNumber.startsWith("62")
                                                ? phoneNumber
                                                : "62" + phoneNumber;
                                        const message = `Halo ${request.requester.name}, mengenai peminjaman buku "${request.book.title}".`;
                                        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
                                        window.open(whatsappUrl, "_blank");
                                    };

                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-100"
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex gap-3">
                                                    {/* Book Cover */}
                                                    <div className="h-24 w-16 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                                        {request.book.coverImageUrl ? (
                                                            <img
                                                                src={request.book.coverImageUrl}
                                                                alt={request.book.title}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Book Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-base font-semibold text-slate-900 line-clamp-2">{request.book.title}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">Permintaan oleh {request.requester.name}</p>
                                                            </div>
                                                            <button
                                                                onClick={() => setDetailRequest(request)}
                                                                className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 transition flex-shrink-0"
                                                                title="Lihat Detail"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold mt-2 ${meta.badgeClass}`}>
                                                            {meta.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid gap-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-slate-500">Diajukan</span>
                                                        <span className="font-medium text-slate-800">{formatDate(request.createdAt)}</span>
                                                    </div>
                                                </div>

                                                <div className="mt-2 flex gap-2">
                                                    {isPending ? (
                                                        <>
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
                                                        </>
                                                    ) : (
                                                        <div className="flex gap-2 w-full">
                                                            <button
                                                                onClick={handleContactRequester}
                                                                disabled={!request.requester.phoneNumber}
                                                                className="flex-1 rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-green-200 transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                                </svg>
                                                                Hubungi Peminjam
                                                            </button>
                                                            <button
                                                                onClick={() => openActionModal("complete", request)}
                                                                className="flex-1 rounded-full bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-600 flex items-center justify-center gap-2"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                Konfirmasi Pengembalian
                                                            </button>
                                                        </div>
                                                    )}
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
                                    const isApproved = request.status === BorrowRequestStatus.APPROVED;

                                    const handleContactOwner = () => {
                                        if (!request.book.owner?.phoneNumber) return;
                                        const phoneNumber = request.book.owner.phoneNumber.replace(/\D/g, "");
                                        const formattedPhone = phoneNumber.startsWith("0")
                                            ? "62" + phoneNumber.slice(1)
                                            : phoneNumber.startsWith("62")
                                                ? phoneNumber
                                                : "62" + phoneNumber;
                                        const message = `Halo ${request.book.owner.name}, mengenai peminjaman buku "${request.book.title}".`;
                                        const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
                                        window.open(whatsappUrl, "_blank");
                                    };

                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-100"
                                        >
                                            <div className="flex flex-col gap-3">
                                                <div className="flex gap-3">
                                                    {/* Book Cover */}
                                                    <div className="h-24 w-16 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                                        {request.book.coverImageUrl ? (
                                                            <img
                                                                src={request.book.coverImageUrl}
                                                                alt={request.book.title}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Book Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-base font-semibold text-slate-900 line-clamp-2">{request.book.title}</p>
                                                                <p className="text-xs text-slate-500 mt-0.5">
                                                                    {meta.label} • {formatDate(request.createdAt)}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => setDetailRequest(request)}
                                                                className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 transition flex-shrink-0"
                                                                title="Lihat Detail"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                        <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold mt-2 ${meta.badgeClass}`}>
                                                            {meta.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-slate-500">{meta.helpText}</p>

                                                {isApproved && (
                                                    <button
                                                        onClick={handleContactOwner}
                                                        disabled={!request.book.owner?.phoneNumber}
                                                        className="w-full rounded-full bg-green-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-green-200 transition hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                        </svg>
                                                        Hubungi Pemilik
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </>
                    )}

                    {activeTab === "pengembalian" && (
                        <>
                            {activeLoans.length === 0 ? (
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
                                    Tidak ada buku yang sedang kamu pinjam saat ini.
                                </div>
                            ) : (
                                activeLoans.map((request) => (
                                    <div
                                        key={request.id}
                                        className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-100"
                                    >
                                        <div className="flex flex-col gap-3">
                                            <div className="flex gap-3">
                                                {/* Book Cover */}
                                                <div className="h-24 w-16 flex-shrink-0 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                                    {request.book.coverImageUrl ? (
                                                        <img
                                                            src={request.book.coverImageUrl}
                                                            alt={request.book.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Book Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-base font-semibold text-slate-900 line-clamp-2">{request.book.title}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                Milik {request.book.owner?.name ?? "Pemilik"}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => setDetailRequest(request)}
                                                            className="rounded-full p-2 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 transition flex-shrink-0"
                                                            title="Lihat Detail"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-2 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-500">Tenggat Waktu</span>
                                                    <span className="font-medium text-slate-800">
                                                        {request.dueDate ? formatDate(request.dueDate) : "-"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-2">
                                                <button
                                                    onClick={() => handleReturnRequest(request)}
                                                    className="w-full rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600"
                                                >
                                                    Ajukan Pengembalian
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
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
                            {actionState.type === "approve" ? "Setujui Peminjaman"
                                : actionState.type === "reject" ? "Tolak Peminjaman"
                                    : actionState.type === "complete" ? "Konfirmasi Pengembalian"
                                        : "Proses Permintaan"}
                        </h3>

                        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            <span className="block text-xs text-slate-500">Peminjam</span>
                            <span className="font-semibold text-slate-900">{actionState.request.requester.name}</span>
                        </div>

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

                            {actionState.type === "complete" && (
                                <p className="text-sm text-slate-600 mb-4 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    Pastikan kamu sudah menerima buku ini kembali dengan kondisi baik sebelum mengonfirmasi.
                                </p>
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
                                <div className="h-20 w-14 rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                                    {detailRequest.book.coverImageUrl ? (
                                        <img
                                            src={detailRequest.book.coverImageUrl}
                                            alt={detailRequest.book.title}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 line-clamp-2">{detailRequest.book.title}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {activeTab === "persetujuan"
                                            ? `Peminjam: ${detailRequest.requester.name}`
                                            : `${detailRequest.status === BorrowRequestStatus.APPROVED ? "Dipinjam dari" : "Milik"} ${detailRequest.book.owner?.name ?? "Pemilik"}`
                                        }
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
                                {detailRequest.dueDate && detailRequest.status === BorrowRequestStatus.APPROVED && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Tenggat Waktu</span>
                                        <span className="text-slate-900">{formatDate(detailRequest.dueDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Confirmation Modal */}
            {returnRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">
                            Ajukan Pengembalian
                        </h3>
                        <p className="text-sm text-slate-600 mb-6">
                            Kamu akan diarahkan ke WhatsApp untuk menghubungi pemilik buku <strong>{returnRequest.book.owner?.name}</strong> dan mengatur pengembalian.
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setReturnRequest(null)}
                                className="flex-1 rounded-full border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleConfirmReturn}
                                className="flex-1 rounded-full bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600 shadow-sm shadow-green-200"
                            >
                                Lanjut ke WhatsApp
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
