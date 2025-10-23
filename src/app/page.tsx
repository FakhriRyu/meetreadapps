import { prisma } from "@/lib/prisma";
import { BookAdminPanel } from "@/components/books/book-admin-panel";

export default async function Home() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-rose-500/10 blur-3xl" />
      </div>
      <main className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/70">
            Admin Peminjaman Buku
          </span>
          <h1 className="text-4xl font-bold sm:text-5xl">
            Dashboard Koleksi{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-rose-300 bg-clip-text text-transparent">
              MeetRead
            </span>
          </h1>
          <p className="max-w-2xl text-base text-white/70">
            Pantau stok, kelola informasi buku, dan pastikan proses peminjaman berjalan mulus
            dengan panel admin yang interaktif dan intuitif.
          </p>
        </header>
        <section className="mt-10 flex-1">
          <BookAdminPanel initialBooks={books} />
        </section>
      </main>
    </div>
  );
}
