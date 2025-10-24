"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";

type AuthMode = "login" | "register";
type AuthPanelProps = {
  defaultMode: AuthMode;
};

type FormState = {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
};

const initialState: FormState = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
};

export function AuthPanel({ defaultMode }: AuthPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>(initialState);
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const mode: AuthMode = useMemo(() => defaultMode, [defaultMode]);

  useEffect(() => {
    setFormState(initialState);
    setStatus(null);
  }, [mode]);

  const title = useMemo(
    () => (mode === "login" ? "Masuk ke MeetRead" : "Buat Akun Baru"),
    [mode],
  );

  const subtitle = useMemo(() => {
    if (mode === "login") {
      return "Masuk untuk mengelola peminjaman, menyimpan buku favorit, dan melanjutkan koleksi bacaanmu.";
    }

    return "Daftar sekarang dan nikmati kemudahan meminjam buku, memantau koleksi, dan mendapatkan rekomendasi personal.";
  }, [mode]);

  const redirectMessage = useMemo(() => {
    const source = searchParams.get("from");
    if (source === "pinjam") {
      return "Kamu perlu masuk sebelum mengajukan peminjaman.";
    }
    if (source === "profil") {
      return "Masuk atau daftar untuk melihat profil lengkapmu.";
    }
    return null;
  }, [searchParams]);

  const handleInputChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormState(initialState);
  };

  const buildAuthUrl = (base: "/login" | "/register") => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("mode");
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };

  const redirectAfterLogin = () => {
    const from = searchParams.get("from") ?? "beranda";
    const book = searchParams.get("book");
    if (from === "pinjam") {
      return book ? `/?tab=pinjam&book=${book}` : "/?tab=pinjam";
    }
    if (from === "profil") {
      return "/?tab=profil";
    }
    return `/${from}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    if (mode === "register" && formState.password !== formState.confirmPassword) {
      setStatus("Konfirmasi kata sandi tidak cocok.");
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formState.name.trim(),
            email: formState.email.trim(),
            phoneNumber: formState.phoneNumber.trim(),
            password: formState.password,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "Registrasi gagal. Coba lagi nanti.");
        }

        resetForm();
        setStatus("Registrasi berhasil! Silakan masuk untuk melanjutkan.");
        router.replace(buildAuthUrl("/login"));
        return;
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: formState.email.trim(),
            password: formState.password,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error ?? "Gagal masuk. Coba lagi nanti.");
        }

        resetForm();
        const redirectUrl = redirectAfterLogin();
        window.location.assign(redirectUrl);
        return;
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    const nextPath = mode === "login" ? "/register" : "/login";
    setStatus(null);
    resetForm();
    router.replace(buildAuthUrl(nextPath));
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-white shadow-2xl shadow-black/40 backdrop-blur">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/60">
          MeetRead
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-white">{title}</h1>
        <p className="text-sm text-white/70">{subtitle}</p>
        {redirectMessage && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {redirectMessage}
          </div>
        )}
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label className="block text-sm text-white/80">
            Nama Lengkap
            <input
              value={formState.name}
              onChange={handleInputChange("name")}
              placeholder="Tuliskan nama lengkapmu"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
              required
            />
          </label>
        )}
        {mode === "register" && (
          <label className="block text-sm text-white/80">
            Nomor WhatsApp
            <input
              type="tel"
              value={formState.phoneNumber}
              onChange={handleInputChange("phoneNumber")}
              placeholder="Contoh: 628123456789"
              pattern="^62[0-9]{8,15}$"
              title="Nomor telepon harus diawali 62 dan minimal 10 digit"
              inputMode="numeric"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
              required
            />
          </label>
        )}
        <label className="block text-sm text-white/80">
          Email
          <input
            type="email"
            value={formState.email}
            onChange={handleInputChange("email")}
            placeholder="contoh@mail.com"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
            required
          />
        </label>
        <label className="block text-sm text-white/80">
          Kata Sandi
          <input
            type="password"
            value={formState.password}
            onChange={handleInputChange("password")}
            placeholder="Minimal 8 karakter"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
            required
            minLength={8}
          />
        </label>
        {mode === "register" && (
          <label className="block text-sm text-white/80">
            Konfirmasi Kata Sandi
            <input
              type="password"
              value={formState.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              placeholder="Ulangi kata sandimu"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-white/20 focus:outline-none"
              required
              minLength={8}
            />
          </label>
        )}

        {status && (
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/80">
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : mode === "login" ? "Masuk Sekarang" : "Daftar Sekarang"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-white/70">
        <p>
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-emerald-300 underline-offset-2 transition hover:text-emerald-200 hover:underline"
              >
                Daftar sekarang
              </button>
            </>
          ) : (
            <>
              Sudah punya akun?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-emerald-300 underline-offset-2 transition hover:text-emerald-200 hover:underline"
              >
                Masuk di sini
              </button>
            </>
          )}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 text-white/70 underline-offset-2 transition hover:text-white hover:underline"
        >
          <span>←</span> Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
