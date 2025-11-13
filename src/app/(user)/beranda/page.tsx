import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { HomeView } from "@/components/user/home-view";

// Revalidate cache setiap 30 detik untuk performa lebih baik
export const revalidate = 30;

// Metadata untuk SEO
export const metadata = {
  title: "Beranda - MeetRead",
  description: "Temukan dan pinjam buku favoritmu di MeetRead",
};

async function BooksData() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return null;
  }

  const books = await prisma.book.findMany({
    where: {
      OR: [{ ownerId: null }, { lendable: true }],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      category: true,
      coverImageUrl: true,
      publishedYear: true,
      totalCopies: true,
      availableCopies: true,
    },
  });

  return <HomeView books={books} sessionUser={sessionUser} />;
}

export default function BerandaPage() {
  return (
    <Suspense fallback={<BerandaLoading />}>
      <BooksData />
    </Suspense>
  );
}

function BerandaLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-24 pt-10">
        <div className="h-7 w-64 animate-pulse rounded-full bg-slate-300" />
        <div className="mt-8 h-12 animate-pulse rounded-2xl bg-slate-100" />
      </main>
    </div>
  );
}
