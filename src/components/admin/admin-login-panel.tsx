"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function AdminLoginPanel() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/loginadmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal masuk sebagai admin.");
      }

      setEmail("");
      setPassword("");
      window.location.assign("/admin");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-8 text-white shadow-2xl shadow-black/40 backdrop-blur">
      <div className="space-y-2">
        <div className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-100">
          Panel Admin
        </div>
        <h1 className="text-2xl font-semibold leading-tight text-white">Masuk sebagai Administrator</h1>
        <p className="text-sm text-white/70">
          Gunakan kredensial admin untuk mengelola katalog buku dan data pengguna.
        </p>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs text-white/70">
          Default: <span className="font-semibold text-white">admin@meetread.com / admin</span>
        </div>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm text-white/80">
          Email Admin
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@meetread.com"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-emerald-300/40 focus:outline-none"
            required
          />
        </label>
        <label className="block text-sm text-white/80">
          Kata Sandi
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan kata sandi admin"
            className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/60 focus:border-emerald-300/40 focus:outline-none"
            required
            minLength={4}
          />
        </label>

        {status && (
          <div className="rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {status}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400 px-6 py-3 text-sm font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:from-emerald-300 hover:to-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Memproses..." : "Masuk Panel Admin"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm text-white/70">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 text-white/70 underline-offset-2 transition hover:text-white hover:underline"
        >
          <span>←</span> Masuk sebagai Pengguna
        </Link>
        <Link
          href="/"
          className="block text-white/70 underline-offset-2 transition hover:text-white hover:underline"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
