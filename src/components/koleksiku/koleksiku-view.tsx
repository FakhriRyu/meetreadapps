"use client";

import { useEffect, useMemo, useState } from "react";

import type { Book, BorrowRequest, BorrowRequestStatus } from "@prisma/client";

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
  | null;

const REQUEST_STATUS_META: Record<
  Extract<BorrowRequestStatus, "PENDING" | "APPROVED">,
  { label: string; badgeClass: string; helpText: string }
> = {
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "bg-amber-400/20 text-amber-100 border border-amber-200/40",
    helpText: "Segera tentukan apakah buku akan dipinjamkan.",
  },
  APPROVED: {
    label: "Sedang Dipinjam",
    badgeClass: "bg-emerald-400/20 text-emerald-100 border border-emerald-200/30",
    helpText: "Buku sedang dipinjam dan menunggu pengembalian.",
  },
};

const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateInput = (value: Date) => value.toISOString().split("T")[0];

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

  const openActionModal = (type: ActionState["type"], request: RequestWithRelations) => {
    setActionState({ type, request });
    setActionMessage("");
    setActionError(null);
    setRequestFeedback(null);
    if (type === "approve") {
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
    const payload: Record<string, unknown> = {};
    if (type === "approve") {
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

      if (type === "approve") {
        const dueDateIso = new Date(actionDueDate).toISOString();
        setLoanRequests((prev) =>
          prev
            .filter((req) => req.book.id !== targetRequest.book.id || req.id === targetRequest.id)
            .map((req) =>
              req.id === targetRequest.id
                ? {
                    ...req,
                    status: "APPROVED",
                    book: { ...req.book, status: "BORROWED", dueDate: dueDateIso },
                  }
                : req,
            ),
        );
        setItems((prev) =>
          prev.map((book) =>
            book.id === targetRequest.book.id
              ? {
                  ...book,
                  status: "BORROWED",
                  borrowerId: targetRequest.requesterId,
                  dueDate: new Date(dueDateIso),
                  availableCopies: Math.max(0, book.availableCopies - 1),
                }
              : book,
          ),
        );
        setRequestFeedback(`Permintaan untuk "${targetRequest.book.title}" disetujui.`);
      } else if (type === "reject") {
        const hasOtherPending = loanRequests.some(
          (req) =>
            req.id !== targetRequest.id &&
            req.book.id === targetRequest.book.id &&
            req.status === BorrowRequestStatus.PENDING,
        );
        setLoanRequests((prev) => prev.filter((req) => req.id !== targetRequest.id));
        setItems((prev) =>
          prev.map((book) => {
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
          }),
        );
        setRequestFeedback(`Permintaan untuk "${targetRequest.book.title}" ditolak.`);
      } else {
        setLoanRequests((prev) => prev.filter((req) => req.id !== targetRequest.id));
        setItems((prev) =>
          prev.map((book) => {
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
          }),
        );
        setRequestFeedback(`Peminjaman "${targetRequest.book.title}" telah selesai.`);
      }

      closeActionModal();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Terjadi kesalahan.");
      setActionLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Koleksiku</h1>
          <p className="text-sm text-white/70">Kelola buku milikmu dan atur status peminjaman.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-5 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300"
        >
          Tambah Koleksi
        </button>
      </header>

      <section className="mt-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/60">Permintaan Peminjaman</p>
            <h2 className="text-lg font-semibold text-white">Butuh Aksi ({pendingCount})</h2>
          </div>
          <div className="rounded-full border border-white/10 px-4 py-1 text-xs text-white/70">
            {loanRequests.length} permintaan aktif
          </div>
        </div>

        {requestFeedback && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {requestFeedback}
          </div>
        )}

        {loanRequests.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/70">
            Belum ada permintaan baru. Saat ada pengguna yang ingin meminjam bukumu, mereka akan muncul di sini.
          </div>
        ) : (
          <div className="space-y-4">
            {loanRequests.map((request) => {
              const statusKey = request.status === "APPROVED" ? "APPROVED" : "PENDING";
              const meta = REQUEST_STATUS_META[statusKey];
              return (
                <div
                  key={request.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white shadow-lg shadow-black/20"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{request.book.title}</p>
                      <p className="text-xs text-white/60">Permintaan oleh {request.requester.name}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs text-white/70 sm:grid-cols-2">
                    <div>
                      <p className="text-white/60">Email</p>
                      <p className="font-semibold text-white/90">{request.requester.email}</p>
                    </div>
                    <div>
                      <p className="text-white/60">WhatsApp</p>
                      <p className="font-semibold text-white/90">
                        {request.requester.phoneNumber ?? "Belum tersedia"}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60">Diajukan</p>
                      <p className="font-semibold text-white/90">{formatDate(request.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-white/60">Batas Pengembalian</p>
                      <p className="font-semibold text-white/90">
                        {request.status === "APPROVED" ? formatDate(request.book.dueDate) : "-"}
                      </p>
                    </div>
                  </div>
                  {request.message && (
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/80">
                      <p className="text-white/60">Catatan peminjam:</p>
                      <p className="mt-1 text-white/90">{request.message}</p>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-white/60">{meta.helpText}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {request.status === "PENDING" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openActionModal("approve", request)}
                          className="flex-1 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:bg-emerald-300 sm:flex-none sm:px-5"
                        >
                          Setujui
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionModal("reject", request)}
                          className="flex-1 rounded-full border border-rose-300/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-rose-200 transition hover:border-rose-200 hover:bg-rose-500/20 sm:flex-none sm:px-5"
                        >
                          Tolak
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openActionModal("complete", request)}
                        className="flex-1 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:border-emerald-200 hover:text-emerald-100 sm:flex-none sm:px-5"
                      >
                        Tandai Dikembalikan
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8 space-y-4">
        <CollectionList collections={items} onEdit={openEditModal} onDelete={handleDelete} deletingId={deletingId} />
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingItem ? "Edit Buku Koleksi" : "Tambah Buku Koleksi"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/70">
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
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {actionState.type === "approve"
                  ? "Setujui Permintaan"
                  : actionState.type === "reject"
                    ? "Tolak Permintaan"
                    : "Tandai Pengembalian"}
              </h3>
              <button
                type="button"
                onClick={closeActionModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-white/70">
              Buku: <span className="font-semibold text-white">{actionState.request.book.title}</span>
            </p>
            <form className="mt-5 space-y-4" onSubmit={handleActionSubmit}>
              {actionState.type === "approve" && (
                <label className="block text-sm text-white/80">
                  Tanggal Pengembalian
                  <input
                    type="date"
                    min={formatDateInput(new Date())}
                    value={actionDueDate}
                    onChange={(event) => setActionDueDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none"
                    required
                  />
                </label>
              )}
              <label className="block text-sm text-white/80">
                Catatan (opsional)
                <textarea
                  value={actionMessage}
                  onChange={(event) => setActionMessage(event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
                  placeholder={
                    actionState.type === "approve"
                      ? "Beritahu peminjam instruksi tambahan."
                      : "Berikan alasan penolakan atau catatan pengembalian."
                  }
                />
              </label>
              {actionError && (
                <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {actionError}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-2 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
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
