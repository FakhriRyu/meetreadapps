"use client";

import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

import { formatDate } from "@/lib/intl-format";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  phoneNumber?: string | null;
  profileImage?: string | null;
  joinedAt?: string | Date;
};

type ProfilViewProps = {
  sessionUser: SessionUser | null;
};

type RequestSummaryEntry = {
  id: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "RETURNED";
  ownerMessage: string | null;
  ownerDecisionAt: string | null;
  createdAt: string;
  book: {
    id: number;
    title: string;
    coverImageUrl: string | null;
    ownerName: string;
    dueDate: string | null;
  };
};

type StatusState =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

const PROFILE_PLACEHOLDER_AVATAR = "https://api.dicebear.com/7.x/initials/png";

export function ProfilView({ sessionUser }: ProfilViewProps) {
  const [isLoggingOut, setLoggingOut] = useState(false);

  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    phoneNumber: string;
    profileImage: string;
    joinedAt: string | null;
  }>({
    name: sessionUser?.name ?? "",
    email: sessionUser?.email ?? "",
    phoneNumber: sessionUser?.phoneNumber ?? "",
    profileImage: sessionUser?.profileImage ?? "",
    joinedAt: sessionUser?.joinedAt ? new Date(sessionUser.joinedAt).toISOString() : null,
  });

  const [basicForm, setBasicForm] = useState({
    name: sessionUser?.name ?? "",
    email: sessionUser?.email ?? "",
    phoneNumber: sessionUser?.phoneNumber ?? "",
    profileImage: sessionUser?.profileImage ?? "",
  });
  const [basicStatus, setBasicStatus] = useState<StatusState>(null);
  const [savingBasic, setSavingBasic] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordStatus, setPasswordStatus] = useState<StatusState>(null);
  const [savingPassword, setSavingPassword] = useState(false);
  const [requestSummary, setRequestSummary] = useState<RequestSummaryEntry[]>([]);
  const [isRequestLoading, setRequestLoading] = useState(false);

  useEffect(() => {
    setProfileData({
      name: sessionUser?.name ?? "",
      email: sessionUser?.email ?? "",
      phoneNumber: sessionUser?.phoneNumber ?? "",
      profileImage: sessionUser?.profileImage ?? "",
      joinedAt: sessionUser?.joinedAt ? new Date(sessionUser.joinedAt).toISOString() : null,
    });
    setBasicForm({
      name: sessionUser?.name ?? "",
      email: sessionUser?.email ?? "",
      phoneNumber: sessionUser?.phoneNumber ?? "",
      profileImage: sessionUser?.profileImage ?? "",
    });
  }, [
    sessionUser,
    sessionUser?.id,
    sessionUser?.name,
    sessionUser?.email,
    sessionUser?.phoneNumber,
    sessionUser?.profileImage,
    sessionUser?.joinedAt,
  ]);

  useEffect(() => {
    if (!sessionUser) {
      setRequestSummary([]);
      return;
    }

    const controller = new AbortController();

    const fetchSummary = async () => {
      try {
        setRequestLoading(true);
        const response = await fetch("/api/borrow/requests/me?limit=5", {
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Gagal memuat permintaan.");
        }
        const data = (await response.json()) as { data?: RequestSummaryEntry[] };
        const entries = data.data ?? [];
        setRequestSummary(entries);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          // ignore fetch failure but keep UI fallback
        }
      } finally {
        setRequestLoading(false);
      }
    };

    fetchSummary();
    return () => controller.abort();
  }, [sessionUser, sessionUser?.id]);

  const isAuthenticated = Boolean(sessionUser);

  const avatarSrc = useMemo(() => {
    if (profileData.profileImage) {
      return profileData.profileImage;
    }

    const seed = profileData.name || "MeetRead";
    return `${PROFILE_PLACEHOLDER_AVATAR}?seed=${encodeURIComponent(seed)}`;
  }, [profileData.name, profileData.profileImage]);

  const formatJoinDate = useMemo(() => {
    if (!profileData.joinedAt) {
      return "-";
    }
    return formatDate(profileData.joinedAt);
  }, [profileData.joinedAt]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      window.location.assign("/login?from=profil");
    }
  };

  const handleBasicChange =
    (field: keyof typeof basicForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setBasicForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleBasicSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBasicStatus(null);

    if (!sessionUser) {
      setBasicStatus({ type: "error", message: "Anda harus masuk terlebih dahulu." });
      return;
    }

    const payload: Record<string, string> = {};
    if (basicForm.name.trim() !== profileData.name) {
      payload.name = basicForm.name.trim();
    }
    if (basicForm.email.trim().toLowerCase() !== profileData.email.toLowerCase()) {
      payload.email = basicForm.email.trim();
    }
    if ((basicForm.phoneNumber ?? "").trim() !== (profileData.phoneNumber ?? "")) {
      payload.phoneNumber = basicForm.phoneNumber.trim();
    }
    if ((basicForm.profileImage ?? "").trim() !== (profileData.profileImage ?? "")) {
      payload.profileImage = basicForm.profileImage.trim();
    }

    if (Object.keys(payload).length === 0) {
      setBasicStatus({ type: "error", message: "Tidak ada perubahan yang perlu disimpan." });
      return;
    }

    setSavingBasic(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal memperbarui profil.");
      }

      setProfileData({
        name: result.data.name,
        email: result.data.email,
        phoneNumber: result.data.phoneNumber ?? "",
        profileImage: result.data.profileImage ?? "",
        joinedAt: result.data.joinedAt ?? profileData.joinedAt,
      });
      setBasicForm({
        name: result.data.name,
        email: result.data.email,
        phoneNumber: result.data.phoneNumber ?? "",
        profileImage: result.data.profileImage ?? "",
      });
      setBasicStatus({ type: "success", message: "Profil berhasil diperbarui." });
    } catch (error) {
      setBasicStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setSavingBasic(false);
    }
  };

  const handlePasswordChange =
    (field: keyof typeof passwordForm) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setPasswordForm((prev) => ({ ...prev, [field]: value }));
    };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordStatus(null);

    if (!sessionUser) {
      setPasswordStatus({ type: "error", message: "Anda harus masuk terlebih dahulu." });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(passwordForm),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal memperbarui kata sandi.");
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordStatus({ type: "success", message: "Kata sandi berhasil diperbarui." });
    } catch (error) {
      setPasswordStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan.",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        {!isAuthenticated ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-indigo-100">
                  <Image
                    src={`${PROFILE_PLACEHOLDER_AVATAR}?seed=MeetRead`}
                    alt="MeetRead Guest"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Selamat Datang di MeetRead</h2>
                  <p className="text-xs text-slate-500">Masuk untuk melihat profil lengkapmu</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign("/login?from=profil")}
                className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600"
              >
                Masuk / Daftar
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              Akses riwayat peminjaman, simpan buku favorit, dan dapatkan rekomendasi yang lebih personal dengan
              masuk ke akun MeetRead.
            </p>
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm shadow-slate-200">
                  <Image src={avatarSrc} alt={profileData.name || "Foto Profil"} fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold text-slate-900">{profileData.name || "Pengguna MeetRead"}</h2>
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
                      {sessionUser?.role ?? "USER"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{profileData.email}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span>Member sejak {formatJoinDate}</span>
                    {profileData.phoneNumber ? <span>• {profileData.phoneNumber}</span> : null}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-slate-500">Permintaan Terbaru</p>
                  <h2 className="text-lg font-semibold text-slate-900">Status Pemantauan</h2>
                </div>
                <Link
                  href="/permintaan"
                  className="rounded-full border border-slate-200 px-4 py-1 text-xs font-semibold text-indigo-500 transition hover:border-indigo-200 hover:bg-indigo-50"
                >
                  Lihat semua →
                </Link>
              </div>
              {isRequestLoading ? (
                <div className="mt-4 grid gap-3">
                  {[0, 1, 2].map((item) => (
                    <div key={`summary-skeleton-${item}`} className="animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="h-4 w-1/3 rounded-full bg-slate-200" />
                      <div className="mt-3 h-3 w-2/3 rounded-full bg-slate-200" />
                      <div className="mt-2 h-3 w-1/2 rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : requestSummary.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">
                  Belum ada permintaan. Ajukan peminjaman untuk melihat statusnya di sini.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {requestSummary.slice(0, 3).map((request) => {
                    const meta = getStatusMeta(request.status);
                    return (
                      <div
                        key={`summary-${request.id}`}
                        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="text-base font-semibold text-slate-900">{request.book.title}</p>
                          <p className="text-xs text-slate-500">
                            {meta.label} • {formatDateLabel(request)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
                <header className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Data Akun Dasar</p>
                  <h3 className="text-lg font-semibold text-slate-900">Perbarui Informasi Profil</h3>
                  <p className="text-sm text-slate-500">Sesuaikan nama, email, nomor telepon, dan foto profilmu.</p>
                </header>

                <form className="mt-5 space-y-4" onSubmit={handleBasicSubmit}>
                  <label className="block text-sm text-slate-600">
                    Nama Lengkap
                    <input
                      value={basicForm.name}
                      onChange={handleBasicChange("name")}
                      placeholder="Tuliskan nama lengkapmu"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                      required
                      minLength={2}
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Email
                    <input
                      type="email"
                      value={basicForm.email}
                      onChange={handleBasicChange("email")}
                      placeholder="contoh@mail.com"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                      required
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Nomor Telepon
                    <input
                      value={basicForm.phoneNumber}
                      onChange={handleBasicChange("phoneNumber")}
                      placeholder="contoh: +62 812 3456 7890"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    URL Foto Profil
                    <input
                      value={basicForm.profileImage}
                      onChange={handleBasicChange("profileImage")}
                      placeholder="https://contoh.com/avatar.jpg"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                    />
                  </label>

                  {basicStatus && <StatusMessage status={basicStatus} />}

                  <button
                    type="submit"
                    disabled={savingBasic}
                    className="w-full rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {savingBasic ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </form>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
                <header className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-400">Pengaturan Akun</p>
                  <h3 className="text-lg font-semibold text-slate-900">Keamanan & Akses</h3>
                  <p className="text-sm text-slate-500">Ganti kata sandi akun dan kelola sesi masukmu.</p>
                </header>

                <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
                  <label className="block text-sm text-slate-600">
                    Kata Sandi Saat Ini
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange("currentPassword")}
                      placeholder="Masukkan kata sandi sekarang"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                      required
                      minLength={8}
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Kata Sandi Baru
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange("newPassword")}
                      placeholder="Minimal 8 karakter"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                      required
                      minLength={8}
                    />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Konfirmasi Kata Sandi Baru
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange("confirmPassword")}
                      placeholder="Ulangi kata sandi baru"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-200 focus:outline-none"
                      required
                      minLength={8}
                    />
                  </label>

                  {passwordStatus && <StatusMessage status={passwordStatus} />}

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {savingPassword ? "Memproses..." : "Perbarui Kata Sandi"}
                  </button>
                </form>

                <div className="mt-6 border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    disabled={isLoggingOut}
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-3 rounded-full border border-rose-200 px-6 py-3 text-sm font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoggingOut ? "Keluar..." : "Keluar Akun"}
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const REQUEST_STATUS_META: Record<
  RequestSummaryEntry["status"],
  { label: string; badgeClass: string; defaultMessage: string }
> = {
  PENDING: {
    label: "Menunggu Konfirmasi",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    defaultMessage: "Permintaanmu masih diproses oleh pemilik.",
  },
  APPROVED: {
    label: "Disetujui",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    defaultMessage: "Pemilik menyetujui permintaanmu. Segera hubungi untuk penjemputan.",
  },
  REJECTED: {
    label: "Ditolak",
    badgeClass: "bg-rose-100 text-rose-700 border border-rose-200",
    defaultMessage: "Permintaanmu tidak dapat diproses.",
  },
  CANCELLED: {
    label: "Dibatalkan",
    badgeClass: "bg-slate-100 text-slate-600 border border-slate-200",
    defaultMessage: "Permintaan dibatalkan oleh sistem atau pemilik.",
  },
  RETURNED: {
    label: "Selesai",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    defaultMessage: "Peminjaman sudah selesai. Terima kasih!",
  },
};

const getStatusMeta = (status: RequestSummaryEntry["status"]) => REQUEST_STATUS_META[status];

const formatDateLabel = (request: RequestSummaryEntry) => {
  const reference = request.ownerDecisionAt ?? request.createdAt;
  return formatDate(reference, { month: "short" });
};

function StatusMessage({ status }: { status: StatusState }) {
  if (!status) return null;

  const styles =
    status.type === "success"
      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border border-rose-200 bg-rose-50 text-rose-600";

  return (
    <div className={`rounded-2xl px-4 py-3 text-sm ${styles}`}>
      {status.message}
    </div>
  );
}
