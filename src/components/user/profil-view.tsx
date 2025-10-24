"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

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
  }, [sessionUser?.id, sessionUser?.name, sessionUser?.email, sessionUser?.phoneNumber, sessionUser?.profileImage, sessionUser?.joinedAt]);

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
    return new Date(profileData.joinedAt).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
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
    <div className="relative min-h-screen px-6 pb-28 pt-10">
      {!isAuthenticated && (
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-xl shadow-black/30">
          <div className="flex items-center gap-4 border-b border-white/5 px-6 py-5">
            <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-emerald-400 to-sky-400">
              <Image
                src={`${PROFILE_PLACEHOLDER_AVATAR}?seed=MeetRead`}
                alt="MeetRead Guest"
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white">Selamat Datang</h2>
              <p className="text-xs text-white/60">Masuk untuk melihat profil lengkapmu</p>
            </div>
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/30" />
          </div>
          <div className="space-y-3 px-6 py-5 text-sm text-white/70">
            <p>
              Akses riwayat peminjaman, simpan buku favorit, dan dapatkan rekomendasi yang lebih personal
              dengan masuk ke akun MeetRead.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign("/login?from=profil")}
              className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300"
            >
              Masuk / Daftar
            </button>
          </div>
        </div>
      )}

      {isAuthenticated && (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/90 shadow-xl shadow-black/30">
            <div className="flex flex-col gap-5 border-b border-white/5 px-6 py-6 sm:flex-row sm:items-center sm:gap-6">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-white/10 shadow-lg shadow-black/30">
                <Image
                  src={avatarSrc}
                  alt={profileData.name || "Foto Profil"}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">{profileData.name || "Pengguna MeetRead"}</h2>
                  <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-100">
                    {sessionUser?.role ?? "USER"}
                  </span>
                </div>
                <p className="text-sm text-white/70">{profileData.email}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-white/50">
                  <span>Member since {formatJoinDate}</span>
                  {profileData.phoneNumber ? <span>• {profileData.phoneNumber}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-xl shadow-black/30">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-300/80">
                  Data Akun Dasar
                </p>
                <h3 className="text-lg font-semibold text-white">Perbarui Informasi Profil</h3>
                <p className="text-sm text-white/60">
                  Sesuaikan nama lengkap, email, nomor telepon, dan foto profilmu.
                </p>
              </header>

              <form className="mt-5 space-y-4" onSubmit={handleBasicSubmit}>
                <label className="block text-sm text-white/80">
                  Nama Lengkap
                  <input
                    value={basicForm.name}
                    onChange={handleBasicChange("name")}
                    placeholder="Tuliskan nama lengkapmu"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/25 focus:outline-none"
                    required
                    minLength={2}
                  />
                </label>
                <label className="block text-sm text-white/80">
                  Email
                  <input
                    type="email"
                    value={basicForm.email}
                    onChange={handleBasicChange("email")}
                    placeholder="contoh@mail.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/25 focus:outline-none"
                    required
                  />
                </label>
                <label className="block text-sm text-white/80">
                  Nomor Telepon
                  <input
                    value={basicForm.phoneNumber}
                    onChange={handleBasicChange("phoneNumber")}
                    placeholder="contoh: +62 812 3456 7890"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/25 focus:outline-none"
                  />
                </label>
                <label className="block text-sm text-white/80">
                  URL Foto Profil
                  <input
                    value={basicForm.profileImage}
                    onChange={handleBasicChange("profileImage")}
                    placeholder="https://contoh.com/avatar.jpg"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/25 focus:outline-none"
                  />
                </label>

                {basicStatus && (
                  <StatusMessage status={basicStatus} />
                )}

                <button
                  type="submit"
                  disabled={savingBasic}
                  className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingBasic ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </form>
            </section>

            <section className="rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-xl shadow-black/30">
              <header className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-300/80">
                  Pengaturan Akun
                </p>
                <h3 className="text-lg font-semibold text-white">Keamanan & Akses</h3>
                <p className="text-sm text-white/60">
                  Ganti kata sandi akun dan kelola sesi masukmu.
                </p>
              </header>

              <form className="mt-5 space-y-4" onSubmit={handlePasswordSubmit}>
                <label className="block text-sm text-white/80">
                  Kata Sandi Saat Ini
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange("currentPassword")}
                    placeholder="Masukkan kata sandi sekarang"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/25 focus:outline-none"
                    required
                    minLength={8}
                  />
                </label>
                <label className="block text-sm text-white/80">
                  Kata Sandi Baru
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange("newPassword")}
                    placeholder="Minimal 8 karakter"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/25 focus:outline-none"
                    required
                    minLength={8}
                  />
                </label>
                <label className="block text-sm text-white/80">
                  Konfirmasi Kata Sandi Baru
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange("confirmPassword")}
                    placeholder="Ulangi kata sandi baru"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 focus:border-white/25 focus:outline-none"
                    required
                    minLength={8}
                  />
                </label>

                {passwordStatus && <StatusMessage status={passwordStatus} />}

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full rounded-full border border-white/20 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-white transition hover:border-emerald-300/60 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? "Memproses..." : "Perbarui Kata Sandi"}
                </button>
              </form>

              <div className="mt-6 border-t border-white/5 pt-5">
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-3 rounded-full border border-rose-300/60 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-rose-200 transition hover:border-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Keluar..." : "Keluar Akun"}
                </button>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusMessage({ status }: { status: StatusState }) {
  if (!status) return null;

  const styles =
    status.type === "success"
      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
      : "border-rose-400/40 bg-rose-400/10 text-rose-100";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${styles}`}>
      {status.message}
    </div>
  );
}
