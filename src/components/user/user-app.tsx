"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Book } from "@prisma/client";

type TabKey = "home" | "pinjam" | "profil";

type UserAppProps = {
  initialBooks: Book[];
};

const NAV_ITEMS: Array<{ key: TabKey; label: string; icon: JSX.Element }> = [
  { key: "home", label: "Beranda", icon: <HomeIcon /> },
  { key: "pinjam", label: "Pinjam", icon: <BorrowIcon /> },
  { key: "profil", label: "Profil", icon: <ProfileIcon /> },
];

export function UserApp({ initialBooks }: UserAppProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [search, setSearch] = useState("");

  const filteredBooks = useMemo(() => {
    if (!search.trim()) {
      return initialBooks;
    }

    const query = search.toLowerCase();
    return initialBooks.filter((book) => {
      return (
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.category?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [initialBooks, search]);

  const heroStats = useMemo(() => {
    const total = initialBooks.length;
    const available = initialBooks.reduce((sum, book) => sum + book.availableCopies, 0);
    return { total, available };
  }, [initialBooks]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-8 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-60 w-60 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="absolute -bottom-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-md flex-col pb-28">
        <header className="px-6 pt-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">Halo, selamat datang</p>
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                MeetRead Library
              </h1>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-sm font-semibold">
              MR
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs uppercase tracking-widest text-white/60">Statistik</p>
            <div className="mt-4 flex items-center justify-between text-white">
              <div>
                <p className="text-sm text-white/70">Total Koleksi</p>
                <p className="text-xl font-semibold">{heroStats.total} Buku</p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <p className="text-sm text-white/70">Eksemplar Tersedia</p>
                <p className="text-xl font-semibold">{heroStats.available}</p>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 flex-1 px-6">
          {activeTab === "home" && (
            <div className="space-y-4">
              <div className="relative">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari judul, penulis, atau kategori…"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 pr-11 text-sm text-white placeholder-white/60 focus:border-white/30 focus:outline-none"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-white/60">
                  <MagnifierIcon />
                </span>
              </div>

              <div className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Rekomendasi Untukmu
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {filteredBooks.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-white/70">
                      Buku yang kamu cari belum tersedia. Coba kata kunci lain ya!
                    </div>
                  ) : (
                    filteredBooks.map((book) => (
                      <article
                        key={book.id}
                        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/10"
                      >
                        <div className="flex gap-4">
                          <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/10">
                            {book.coverImageUrl ? (
                              <Image
                                src={book.coverImageUrl}
                                alt={book.title}
                                fill
                                sizes="70px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-white/50">
                                No Cover
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col justify-between">
                            <div>
                              <h3 className="text-base font-semibold text-white">
                                {book.title}
                              </h3>
                              <p className="text-xs text-white/60">oleh {book.author}</p>
                              {book.description && (
                                <p className="mt-2 line-clamp-2 text-xs text-white/60">
                                  {book.description}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                              <span className="rounded-full bg-white/10 px-3 py-1">
                                {book.category ?? "Umum"}
                              </span>
                              <span>
                                Tersedia{" "}
                                <strong className="text-white">
                                  {book.availableCopies}
                                </strong>{" "}
                                / {book.totalCopies}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "pinjam" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-emerald-400/40 bg-emerald-400/15 p-5 text-white">
                <h2 className="text-lg font-semibold">Langkah Meminjam Buku</h2>
                <ol className="mt-3 space-y-2 text-sm text-white/80">
                  <li>1. Temukan buku favoritmu dari katalog.</li>
                  <li>2. Klik tombol &quot;Ajukan Peminjaman&quot; di halaman detail.</li>
                  <li>3. Datang ke perpustakaan untuk mengambil buku dalam 24 jam.</li>
                </ol>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                  Pilihan Populer
                </h3>
                <div className="space-y-3">
                  {initialBooks.slice(0, 4).map((book) => (
                    <div
                      key={`borrow-${book.id}`}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{book.title}</p>
                        <p className="text-xs text-white/60">oleh {book.author}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-lg shadow-emerald-400/30 transition hover:bg-emerald-300"
                      >
                        Ajukan
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "profil" && (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400 text-lg font-semibold text-emerald-950">
                    MR
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Fakhri Alwan</h2>
                    <p className="text-sm text-white/60">Anggota sejak 2024</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Status Peminjaman
                  </p>
                  <p className="mt-2 text-white">
                    Kamu belum memiliki peminjaman aktif. Ayo pilih buku favoritmu!
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">
                    Riwayat Aktivitas
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>- Bergabung dengan MeetRead</li>
                    <li>- Menyelesaikan peminjaman &quot;Atomic Habits&quot;</li>
                    <li>- Menyimpan buku favorit untuk dibaca nanti</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto mb-4 flex w-full max-w-md items-center justify-between rounded-full border border-white/10 bg-slate-900/80 px-4 py-2 shadow-lg shadow-black/30 backdrop-blur">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition ${
                isActive ? "text-white" : "text-white/60"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                  isActive
                    ? "border-white/20 bg-emerald-400/20 text-white"
                    : "border-transparent bg-white/5 text-white/70"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M3 10.75 12 4l9 6.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 13v7h5v-4h4v4h5v-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BorrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 6h12a4 4 0 0 1 4 4v10H8a4 4 0 0 1-4-4V6Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6V4a2 2 0 0 1 2-2h6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 20a7.94 7.94 0 0 1 16 0" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MagnifierIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-2.6-2.6" strokeLinecap="round" />
    </svg>
  );
}
