"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

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
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);
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
      return book ? `/pinjam?book=${book}` : "/pinjam";
    }
    if (from === "profil") {
      return "/profil";
    }
    return from.startsWith("/") ? from : `/${from}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    if (mode === "register" && formState.password !== formState.confirmPassword) {
      setStatus({ type: "error", message: "Konfirmasi kata sandi tidak cocok." });
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
        setStatus({ type: "success", message: "Registrasi berhasil! Silakan masuk untuk melanjutkan." });
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
      const message = error instanceof Error ? error.message : "Terjadi kesalahan.";
      setStatus({ type: "error", message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal menghubungkan ke Google.";
      setStatus({ type: "error", message });
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
    <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-slate-900 shadow-xl shadow-indigo-100">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-indigo-600">
          MeetRead
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{subtitle}</p>
        {redirectMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {redirectMessage}
          </div>
        )}
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        {mode === "register" && (
          <label className="block text-sm font-medium text-slate-700">
            Nama Lengkap
            <input
              value={formState.name}
              onChange={handleInputChange("name")}
              placeholder="Tuliskan nama lengkapmu"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              required
            />
          </label>
        )}
        {mode === "register" && (
          <label className="block text-sm font-medium text-slate-700">
            Nomor WhatsApp
            <input
              type="tel"
              value={formState.phoneNumber}
              onChange={handleInputChange("phoneNumber")}
              placeholder="Contoh: 628123456789"
              pattern="^62[0-9]{8,15}$"
              title="Nomor telepon harus diawali 62 dan minimal 10 digit"
              inputMode="numeric"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              required
            />
          </label>
        )}
        <label className="block text-sm font-medium text-slate-700">
          Email
          <input
            type="email"
            value={formState.email}
            onChange={handleInputChange("email")}
            placeholder="contoh@mail.com"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Kata Sandi
          <input
            type="password"
            value={formState.password}
            onChange={handleInputChange("password")}
            placeholder="Minimal 8 karakter"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            required
            minLength={8}
          />
        </label>
        {mode === "register" && (
          <label className="block text-sm font-medium text-slate-700">
            Konfirmasi Kata Sandi
            <input
              type="password"
              value={formState.confirmPassword}
              onChange={handleInputChange("confirmPassword")}
              placeholder="Ulangi kata sandimu"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              required
              minLength={8}
            />
          </label>
        )}

        {status && (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${status.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
          >
            {status.message}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-400 hover:to-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : mode === "login" ? "Masuk Sekarang" : "Daftar Sekarang"}
        </button>
      </form>

      <div className="relative mt-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">Atau</span>
        </div>
      </div>

      <button
        onClick={handleGoogleLogin}
        disabled={isSubmitting}
        className="mt-4 flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
            fill="#EA4335"
          />
        </svg>
        {isSubmitting ? "Menghubungkan..." : "Lanjutkan dengan Google"}
      </button>

      <div className="mt-6 space-y-3 text-center text-sm text-slate-500">
        <p>
          {mode === "login" ? (
            <>
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-indigo-500 underline-offset-2 transition hover:text-indigo-600 hover:underline"
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
                className="font-semibold text-indigo-500 underline-offset-2 transition hover:text-indigo-600 hover:underline"
              >
                Masuk di sini
              </button>
            </>
          )}
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 text-slate-500 underline-offset-2 transition hover:text-indigo-500 hover:underline"
        >
          <span>←</span> Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
