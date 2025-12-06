"use client";

import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/intl-format";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { User, Shield, MessageSquare, LogOut, ChevronRight, Moon } from "lucide-react";

type SessionUser = {
  id: number;
  name: string | null;
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

  // Sheet States
  const [isBasicOpen, setBasicOpen] = useState(false);
  const [isPasswordOpen, setPasswordOpen] = useState(false);
  const [isSuggestionOpen, setSuggestionOpen] = useState(false);

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

  const [suggestion, setSuggestion] = useState("");
  const [suggestionStatus, setSuggestionStatus] = useState<StatusState>(null);
  const [sendingSuggestion, setSendingSuggestion] = useState(false);

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
  }, [sessionUser]);

  const isAuthenticated = Boolean(sessionUser);

  const avatarSrc = useMemo(() => {
    if (profileData.profileImage) {
      return profileData.profileImage;
    }
    const seed = profileData.name || "MeetRead";
    return `${PROFILE_PLACEHOLDER_AVATAR}?seed=${encodeURIComponent(seed)}`;
  }, [profileData.name, profileData.profileImage]);

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

  const handleBasicChange = (field: keyof typeof basicForm) => (event: ChangeEvent<HTMLInputElement>) => {
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
    if (basicForm.name.trim() !== profileData.name) payload.name = basicForm.name.trim();
    if (basicForm.email.trim().toLowerCase() !== profileData.email.toLowerCase()) payload.email = basicForm.email.trim();
    if ((basicForm.phoneNumber ?? "").trim() !== (profileData.phoneNumber ?? "")) payload.phoneNumber = basicForm.phoneNumber.trim();
    if ((basicForm.profileImage ?? "").trim() !== (profileData.profileImage ?? "")) payload.profileImage = basicForm.profileImage.trim();

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
      if (!response.ok) throw new Error(result.error ?? "Gagal memperbarui profil.");

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
      setTimeout(() => setBasicOpen(false), 1500);
    } catch (error) {
      setBasicStatus({ type: "error", message: error instanceof Error ? error.message : "Terjadi kesalahan." });
    } finally {
      setSavingBasic(false);
    }
  };

  const handlePasswordChange = (field: keyof typeof passwordForm) => (event: ChangeEvent<HTMLInputElement>) => {
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
      if (!response.ok) throw new Error(result.error ?? "Gagal memperbarui kata sandi.");

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus({ type: "success", message: "Kata sandi berhasil diperbarui." });
      setTimeout(() => setPasswordOpen(false), 1500);
    } catch (error) {
      setPasswordStatus({ type: "error", message: error instanceof Error ? error.message : "Terjadi kesalahan." });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSuggestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuggestionStatus(null);

    if (!sessionUser) {
      setSuggestionStatus({ type: "error", message: "Anda harus masuk terlebih dahulu." });
      return;
    }

    setSendingSuggestion(true);
    try {
      const response = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestion }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Gagal mengirim saran.");

      setSuggestion("");
      setSuggestionStatus({ type: "success", message: "Terima kasih atas saran Anda!" });
      setTimeout(() => setSuggestionOpen(false), 1500);
    } catch (error) {
      setSuggestionStatus({ type: "error", message: error instanceof Error ? error.message : "Terjadi kesalahan." });
    } finally {
      setSendingSuggestion(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white px-6 pb-24 pt-10 text-slate-900">
        <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 text-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-indigo-50 bg-indigo-100">
            <Image
              src={`${PROFILE_PLACEHOLDER_AVATAR}?seed=MeetRead`}
              alt="MeetRead Guest"
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Selamat Datang</h2>
            <p className="text-slate-500">Masuk untuk mengelola profil dan melihat aktivitasmu.</p>
          </div>
          <button
            onClick={() => window.location.assign("/login?from=profil")}
            className="w-full rounded-full bg-indigo-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95"
          >
            Masuk / Daftar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-6 pb-24 pt-10 text-slate-900">
      <div className="mx-auto w-full max-w-md space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full border-4 border-indigo-50 bg-slate-100 shadow-inner">
            <Image src={avatarSrc} alt={profileData.name} fill className="object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{profileData.name}</h1>
          <p className="text-slate-500">{profileData.email}</p>
        </div>

        {/* Menu List */}
        <div className="space-y-1">
          {/* Dark Mode (Static for now as requested "tidak perlu darkmode" but keeping UI consistent if needed later or just static) */}
          {/* User requested "tidak perlu darkmode", so I will skip the toggle but maybe keep the item if it was in the design reference? 
              The reference had it. But user said "tidak perlu darkmode". I will omit it to be safe and follow "tidak perlu".
          */}

          <MenuItem
            icon={User}
            label="Data Akun Dasar"
            onClick={() => setBasicOpen(true)}
          />
          <MenuItem
            icon={Shield}
            label="Keamanan & Akses"
            onClick={() => setPasswordOpen(true)}
          />
          <MenuItem
            icon={MessageSquare}
            label="Saran Aplikasi"
            onClick={() => setSuggestionOpen(true)}
          />

          <div className="my-4 h-px bg-slate-100" />

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition active:bg-slate-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <LogOut size={20} />
            </div>
            <span className="flex-1 font-medium text-rose-600">
              {isLoggingOut ? "Keluar..." : "Keluar Akun"}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Sheets */}

      {/* Basic Data Sheet */}
      <BottomSheet isOpen={isBasicOpen} onClose={() => setBasicOpen(false)} title="Data Akun Dasar">
        <form onSubmit={handleBasicSubmit} className="space-y-5">
          <p className="text-sm text-slate-500">Perbarui informasi dasar profilmu di sini.</p>
          <div className="space-y-4">
            <InputGroup label="Nama Lengkap" value={basicForm.name} onChange={handleBasicChange("name")} placeholder="Nama Lengkap" />
            <InputGroup label="Email" value={basicForm.email} onChange={handleBasicChange("email")} type="email" placeholder="Email" />
            <InputGroup label="Nomor Telepon" value={basicForm.phoneNumber} onChange={handleBasicChange("phoneNumber")} placeholder="+62..." />
            <InputGroup label="URL Foto Profil" value={basicForm.profileImage} onChange={handleBasicChange("profileImage")} placeholder="https://..." />
          </div>
          {basicStatus && <StatusMessage status={basicStatus} />}
          <Button loading={savingBasic}>Simpan Perubahan</Button>
        </form>
      </BottomSheet>

      {/* Password Sheet */}
      <BottomSheet isOpen={isPasswordOpen} onClose={() => setPasswordOpen(false)} title="Keamanan & Akses">
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <p className="text-sm text-slate-500">Kelola kata sandi untuk menjaga keamanan akunmu.</p>
          <div className="space-y-4">
            <InputGroup label="Kata Sandi Saat Ini" value={passwordForm.currentPassword} onChange={handlePasswordChange("currentPassword")} type="password" placeholder="••••••••" required />
            <InputGroup label="Kata Sandi Baru" value={passwordForm.newPassword} onChange={handlePasswordChange("newPassword")} type="password" placeholder="••••••••" required />
            <InputGroup label="Konfirmasi Kata Sandi" value={passwordForm.confirmPassword} onChange={handlePasswordChange("confirmPassword")} type="password" placeholder="••••••••" required />
          </div>
          {passwordStatus && <StatusMessage status={passwordStatus} />}
          <Button loading={savingPassword}>Perbarui Kata Sandi</Button>
        </form>
      </BottomSheet>

      {/* Suggestion Sheet */}
      <BottomSheet isOpen={isSuggestionOpen} onClose={() => setSuggestionOpen(false)} title="Saran Aplikasi">
        <form onSubmit={handleSuggestionSubmit} className="space-y-5">
          <p className="text-sm text-slate-500">Masukanmu sangat berharga untuk pengembangan aplikasi ini.</p>
          <div>
            <textarea
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              placeholder="Tuliskan saran atau masukanmu di sini..."
              className="h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          {suggestionStatus && <StatusMessage status={suggestionStatus} />}
          <Button loading={sendingSuggestion}>Kirim Saran</Button>
        </form>
      </BottomSheet>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition active:bg-slate-50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-600">
        <Icon size={20} />
      </div>
      <span className="flex-1 font-medium text-slate-900">{label}</span>
      <ChevronRight size={20} className="text-slate-300" />
    </button>
  );
}

function InputGroup({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        {...props}
      />
    </label>
  );
}

function Button({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {loading ? "Memproses..." : children}
    </button>
  );
}

function StatusMessage({ status }: { status: StatusState }) {
  if (!status) return null;
  const isSuccess = status.type === "success";
  return (
    <div className={`rounded-xl px-4 py-3 text-sm ${isSuccess ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"}`}>
      {status.message}
    </div>
  );
}
