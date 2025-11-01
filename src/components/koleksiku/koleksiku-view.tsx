"use client";

import { useEffect, useMemo, useState } from "react";

import { BorrowRequestStatus } from "@prisma/client";
import type { Book, BorrowRequest } from "@prisma/client";

import { formatDate } from "@/lib/intl-format";

import { CollectionForm, type CollectionPayload } from "./collection-form";
import { CollectionList } from "./collection-list";

type RequestWithRelations = BorrowRequest & {
  book: Pick<
    Book,
    "id" | "title" | "status" | "dueDate" | "availableCopies" | "totalCopies" | "lendable"
  >;
  requester: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
};

type KoleksikuViewProps = {
  collections: Book[];
  requests: RequestWithRelations[];
};

type ActionState =
  | { type: "approve"; request: RequestWithRelations }
  | { type: "reject"; request: RequestWithRelations }
  | { type: "complete"; request: RequestWithRelations }
  | { type: "extend"; request: RequestWithRelations }
  | null;

type ActionType = NonNullable<ActionState>["type"];

type PendingAction = { requestId: number; type: ActionType };

const REQUEST_STATUS_META: Record<
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

const formatDateInput = (value: Date) => value.toISOString().split("T")[0];

type OptimisticStateParams = {
  type: ActionType;
  targetRequest: RequestWithRelations;
  dueDateValue: Date | null;
  loanRequests: RequestWithRelations[];
  items: Book[];
};

type OptimisticStateResult = {
  loanRequests: RequestWithRelations[];
  items: Book[];
  feedback: string;
};

function deriveOptimisticState({
  type,
  targetRequest,
  dueDateValue,
  loanRequests,
  items,
}: OptimisticStateParams): OptimisticStateResult {
  if (type === "approve") {
    const dueDate = dueDateValue ?? new Date();
    const updatedLoanRequests = loanRequests
      .filter((req) => req.book.id !== targetRequest.book.id || req.id === targetRequest.id)
      .map((req) =>
        req.id === targetRequest.id
          ? {
              ...req,
              status: "APPROVED",
              book: { ...req.book, status: "BORROWED", dueDate },
            }
          : req,
      );
    const updatedItems = items.map((book) =>
      book.id === targetRequest.book.id
        ? {
            ...book,
            status: "BORROWED",
            borrowerId: targetRequest.requesterId,
            dueDate,
            availableCopies: Math.max(0, book.availableCopies - 1),
          }
        : book,
    );
    return {
      loanRequests: updatedLoanRequests,
      items: updatedItems,
      feedback: `Permintaan untuk "${targetRequest.book.title}" disetujui.`,
    };
  }

  if (type === "reject") {
    const hasOtherPending = loanRequests.some(
      (req) =>
        req.id !== targetRequest.id &&
        req.book.id === targetRequest.book.id &&
        req.status === BorrowRequestStatus.PENDING,
    );
    const updatedLoanRequests = loanRequests.filter((req) => req.id !== targetRequest.id);
    const updatedItems = items.map((book) => {
      if (book.id !== targetRequest.book.id) {
        return book;
      }
      if (hasOtherPending) {
        return {
          ...book,
          status: "PENDING",
          borrowerId: null,
          dueDate: null,
        };
      }
      const fallbackStatus = book.lendable
        ? book.availableCopies > 0
          ? "AVAILABLE"
          : "RESERVED"
        : "UNAVAILABLE";
      return {
        ...book,
        status: fallbackStatus,
        borrowerId: null,
        dueDate: null,
      };
    });
    return {
      loanRequests: updatedLoanRequests,
      items: updatedItems,
      feedback: `Permintaan untuk "${targetRequest.book.title}" ditolak.`,
    };
  }

  if (type === "extend") {
    const dueDate = dueDateValue ?? new Date();
    const updatedLoanRequests = loanRequests.map((req) =>
      req.id === targetRequest.id ? { ...req, book: { ...req.book, dueDate } } : req,
    );
    const updatedItems = items.map((book) =>
      book.id === targetRequest.book.id ? { ...book, dueDate } : book,
    );
    return {
      loanRequests: updatedLoanRequests,
      items: updatedItems,
      feedback: `Jatuh tempo "${targetRequest.book.title}" diperpanjang.`,
    };
  }

  const updatedLoanRequests = loanRequests.filter((req) => req.id !== targetRequest.id);
  const updatedItems = items.map((book) => {
    if (book.id !== targetRequest.book.id) {
      return book;
    }
    const restored = Math.min(book.totalCopies, book.availableCopies + 1);
    const nextStatus = book.lendable
      ? restored > 0
        ? "AVAILABLE"
        : "RESERVED"
      : "UNAVAILABLE";
    return {
      ...book,
      status: nextStatus,
      borrowerId: null,
      dueDate: null,
      availableCopies: restored,
    };
  });
  return {
    loanRequests: updatedLoanRequests,
    items: updatedItems,
    feedback: `Peminjaman "${targetRequest.book.title}" telah selesai.`,
  };
}

export function KoleksikuView({ collections, requests }: KoleksikuViewProps) {
  const [items, setItems] = useState<Book[]>(collections);
  const [loanRequests, setLoanRequests] = useState<RequestWithRelations[]>(requests);
  const [requestFeedback, setRequestFeedback] = useState<string | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Book | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [actionState, setActionState] = useState<ActionState>(null);
  const [actionDueDate, setActionDueDate] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  useEffect(() => {
    setItems(collections);
  }, [collections]);

  useEffect(() => {
    setLoanRequests(requests);
  }, [requests]);

  const pendingCount = useMemo(
    () => loanRequests.filter((request) => request.status === "PENDING").length,
    [loanRequests],
  );

  const handleSubmit = async (payload: CollectionPayload) => {
    setSubmitting(true);
    try {
      let response: Response;
      if (editingItem) {
        response = await fetch(`/api/collections/${Number(editingItem.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan koleksi");
      }

      const updatedBook: Book = result.data;

      if (editingItem) {
        setItems((prev) => prev.map((book) => (book.id === editingItem.id ? updatedBook : book)));
      } else {
        setItems((prev) => [updatedBook, ...prev]);
      }

      setModalOpen(false);
      setEditingItem(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (book: Book) => {
    const confirmed = window.confirm(`Hapus koleksi "${book.title}"?`);
    if (!confirmed) return;

    setDeletingId(book.id);
    try {
      const response = await fetch(`/api/collections/${Number(book.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menghapus koleksi");
      }
      setItems((prev) => prev.filter((item) => item.id !== book.id));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Gagal menghapus koleksi");
    } finally {
      setDeletingId(null);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEditModal = (book: Book) => {
    setEditingItem(book);
    setModalOpen(true);
  };

  const openActionModal = (type: ActionType, request: RequestWithRelations) => {
    setActionState({ type, request });
    setActionMessage("");
    setActionError(null);
    setRequestFeedback(null);
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

  const initialData: CollectionPayload | undefined = editingItem
    ? {
        title: editingItem.title,
        author: editingItem.author,
        category: editingItem.category,
        description: editingItem.description,
        coverImageUrl: editingItem.coverImageUrl,
        isbn: editingItem.isbn ?? null,
        publishedYear: editingItem.publishedYear ?? null,
        lendable: editingItem.lendable,
        totalCopies: editingItem.totalCopies,
        availableCopies: editingItem.availableCopies,
        status: editingItem.status,
      }
    : undefined;

  const handleActionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!actionState) return;

    const { request: targetRequest, type } = actionState;
    let dueDateValue: Date | null = null;

    const payload: Record<string, unknown> = {};
    if (type === "approve" || type === "extend") {
      if (!actionDueDate) {
        setActionError("Tanggal pengembalian wajib diisi.");
        return;
      }
      dueDateValue = new Date(actionDueDate);
      if (Number.isNaN(dueDateValue.getTime())) {
        setActionError("Tanggal pengembalian tidak valid.");
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

    const previousLoanRequests = loanRequests;
    const previousItems = items;
    const previousFeedback = requestFeedback;

    const optimisticResult = deriveOptimisticState({
      type,
      targetRequest,
      dueDateValue,
      loanRequests: previousLoanRequests,
      items: previousItems,
    });

    setLoanRequests(optimisticResult.loanRequests);
    setItems(optimisticResult.items);
    setPendingAction({ requestId: targetRequest.id, type });

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

      setRequestFeedback(optimisticResult.feedback);
      setPendingAction(null);
      closeActionModal();
    } catch (error) {
      setLoanRequests(previousLoanRequests);
      setItems(previousItems);
      setPendingAction(null);
      setRequestFeedback(previousFeedback);
      setActionError(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Koleksiku</h1>
            <p className="text-sm text-slate-500">Kelola buku milikmu dan atur status peminjaman.</p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600"
          >
            Tambah Koleksi
          </button>
        </header>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500">Permintaan Peminjaman</p>
              <h2 className="text-lg font-semibold text-slate-900">Butuh Aksi ({pendingCount})</h2>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-4 py-1 text-xs text-slate-600 shadow-sm shadow-slate-100">
              {loanRequests.length} permintaan aktif
            </div>
          </div>

          {requestFeedback && (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              {requestFeedback}
            </div>
          )}

          {loanRequests.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center text-sm text-slate-500 shadow-sm shadow-slate-100">
              Belum ada permintaan baru. Saat ada pengguna yang ingin meminjam bukumu, mereka akan muncul di sini.
            </div>
          ) : (
            <div className="space-y-4">
              {loanRequests.map((request) => {
                const statusKey = request.status === "APPROVED" ? "APPROVED" : "PENDING";
                const meta = REQUEST_STATUS_META[statusKey];
                const isProcessing = pendingAction?.requestId === request.id;
                const processingType = pendingAction?.type;
                return (
                  <div
                    key={request.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm shadow-slate-100"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                        <p className="text-xs text-slate-500">Permintaan oleh {request.requester.name}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 text-xs text-slate-600 sm:grid-cols-2">
                      <div>
                        <p className="text-slate-500">Email</p>
                        <p className="font-semibold text-slate-800">{request.requester.email}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">WhatsApp</p>
                        <p className="font-semibold text-slate-800">
                          {request.requester.phoneNumber ?? "Belum tersedia"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Diajukan</p>
                        <p className="font-semibold text-slate-800">{formatDate(request.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">Batas Pengembalian</p>
                        <p className="font-semibold text-slate-800">
                          {request.status === "APPROVED" ? formatDate(request.book.dueDate) : "-"}
                        </p>
                      </div>
                    </div>
                    {request.message && (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                        <p className="text-slate-500">Catatan peminjam:</p>
                        <p className="mt-1 text-slate-700">{request.message}</p>
                      </div>
                    )}
                    <p className="mt-3 text-xs text-slate-500">{meta.helpText}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {request.status === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal("approve", request)}
                            disabled={isProcessing}
                            className="flex-1 rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 sm:flex-none sm:px-5"
                          >
                            {isProcessing && processingType === "approve" ? "Memproses..." : "Setujui"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal("reject", request)}
                            disabled={isProcessing}
                            className="flex-1 rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5"
                          >
                            {isProcessing && processingType === "reject" ? "Memproses..." : "Tolak"}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openActionModal("extend", request)}
                            disabled={isProcessing}
                            className="flex-1 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5"
                          >
                            {isProcessing && processingType === "extend" ? "Memproses..." : "Perpanjang Tempo"}
                          </button>
                          <button
                            type="button"
                            onClick={() => openActionModal("complete", request)}
                            disabled={isProcessing}
                            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-5"
                          >
                            {isProcessing && processingType === "complete" ? "Memproses..." : "Tandai Dikembalikan"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <CollectionList collections={items} onEdit={openEditModal} onDelete={handleDelete} deletingId={deletingId} />
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl shadow-slate-200 sm:max-h-[calc(100vh-6.5rem)]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingItem ? "Edit Buku Koleksi" : "Tambah Buku Koleksi"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Bagikan koleksi buku pribadimu agar teman dapat meminjam, atau simpan hanya untuk catatan pribadi.
            </p>
            <div className="mt-5">
              <CollectionForm
                key={editingItem ? editingItem.id : "create"}
                onSubmit={handleSubmit}
                onClose={() => {
                  setModalOpen(false);
                  setEditingItem(null);
                }}
                isSubmitting={isSubmitting}
                initialData={initialData}
                submitLabel={editingItem ? "Simpan Perubahan" : "Simpan Koleksi"}
              />
            </div>
          </div>
        </div>
      )}

      {actionState && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-800 shadow-xl shadow-slate-200 sm:max-h-[calc(100vh-6.5rem)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {actionState.type === "approve"
                  ? "Setujui Permintaan"
                  : actionState.type === "reject"
                    ? "Tolak Permintaan"
                    : actionState.type === "extend"
                      ? "Perpanjang Jatuh Tempo"
                      : "Tandai Pengembalian"}
              </h3>
              <button
                type="button"
                onClick={closeActionModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-indigo-200 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Buku: <span className="font-semibold text-slate-900">{actionState.request.book.title}</span>
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleActionSubmit}>
              {(actionState.type === "approve" || actionState.type === "extend") && (
                <label className="block text-sm text-slate-600">
                  Tanggal Pengembalian
                  <input
                    type="date"
                    min={formatDateInput(new Date())}
                    value={actionDueDate}
                    onChange={(event) => setActionDueDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-indigo-200 focus:outline-none"
                    required
                  />
                </label>
              )}
              <label className="block text-sm text-slate-600">
                Catatan (opsional)
                <textarea
                  value={actionMessage}
                  onChange={(event) => setActionMessage(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                  placeholder={
                    actionState.type === "approve"
                      ? "Beritahu peminjam instruksi tambahan."
                      : actionState.type === "reject"
                        ? "Berikan alasan penolakan."
                        : actionState.type === "extend"
                          ? "Sampaikan alasan perpanjangan atau info tambahan."
                          : "Berikan catatan pengembalian."
                  }
                />
              </label>
              {actionError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  {actionError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-full bg-indigo-500 px-6 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                >
                  {actionLoading ? "Memproses..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
