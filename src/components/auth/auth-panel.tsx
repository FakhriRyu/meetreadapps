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
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {status}
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
