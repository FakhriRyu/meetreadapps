import { Suspense } from "react";
import { supabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
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

  const { data: books, error } = await supabaseServer
    .from('Book')
    .select('id, title, author, category, coverImageUrl, publishedYear, totalCopies, availableCopies')
    .or('ownerId.is.null,lendable.eq.true')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
    return <HomeView books={[]} sessionUser={sessionUser} />;
  }

  return <HomeView books={books || []} sessionUser={sessionUser} />;
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
