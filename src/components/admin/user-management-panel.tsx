"use client";

import { useMemo, useState } from "react";

import { formatDate, formatNumber } from "@/lib/intl-format";

export type ManagedUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};

type StatusState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

type UserManagementPanelProps = {
  initialUsers: ManagedUser[];
};

export function UserManagementPanel({ initialUsers }: UserManagementPanelProps) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusState>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    role: "USER",
  });
  const [isSubmitting, setSubmitting] = useState(false);

  const overview = useMemo(() => {
    const total = users.length;
    const admin = users.filter((user) => user.role === "ADMIN").length;
    const members = total - admin;
    return { total, admin, members };
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return users;
    }

    const query = search.toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [users, search]);

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setFormState({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setStatus(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    if (!editingUser) {
      return;
    }

    const payload: Partial<FormState> = {};
    if (formState.name.trim() !== editingUser.name) {
      payload.name = formState.name.trim();
    }
    if (formState.email.trim() !== editingUser.email) {
      payload.email = formState.email.trim();
    }
    if (formState.role !== editingUser.role) {
      payload.role = formState.role;
    }

    if (Object.keys(payload).length === 0) {
      setStatus({
        type: "error",
        message: "Tidak ada perubahan yang perlu disimpan.",
      });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal memperbarui pengguna.");
      }

      const updated: ManagedUser = {
        ...result.data,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      };

      setUsers((current) =>
        current.map((user) => (user.id === updated.id ? updated : user)),
      );

      setStatus({
        type: "success",
        message: "Data pengguna berhasil diperbarui.",
      });
      setModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Gagal memperbarui pengguna.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-6 text-slate-900">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
          <p className="text-xs uppercase tracking-widest text-slate-500">Total Pengguna</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatNumber(overview.total)}</p>
          <p className="text-xs text-slate-500">Termasuk pengguna dan admin.</p>
        </div>
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm shadow-emerald-100">
          <p className="text-xs uppercase tracking-widest text-emerald-600/80">Admin Aktif</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatNumber(overview.admin)}</p>
          <p className="text-xs text-emerald-600/80">Pengguna dengan akses penuh.</p>
        </div>
        <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-sm shadow-sky-100">
          <p className="text-xs uppercase tracking-widest text-sky-600/80">Member</p>
          <p className="mt-2 text-2xl font-semibold text-sky-700">{formatNumber(overview.members)}</p>
          <p className="text-xs text-sky-600/80">Akun terdaftar reguler.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Daftar Pengguna</h2>
            <p className="text-sm text-slate-500">
              Cari pengguna berdasarkan nama, email, atau peran.
            </p>
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari pengguna…"
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
          />
        </div>

        {status && (
          <div
            className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
              status.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="mt-4 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm text-slate-500">
              Pengguna tidak ditemukan.
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm shadow-slate-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-slate-900">
                    {user.name}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        user.role === "ADMIN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.role}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Bergabung {formatDate(user.createdAt)} &middot; Diperbarui {formatDate(user.updatedAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openEditModal(user)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                >
                  Edit Pengguna
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl shadow-indigo-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Edit Data Pengguna</h3>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Perbarui informasi akun atau tingkatkan peran pengguna.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-slate-700">
                Nama Lengkap
                <input
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Masukkan nama lengkap"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Email
                <input
                  type="email"
                  value={formState.email}
                  onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="contoh@email.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Peran
                <select
                  value={formState.role}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, role: event.target.value as "USER" | "ADMIN" }))
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
