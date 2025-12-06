import { Suspense } from "react";
import { getSupabaseServer } from "@/lib/supabase";
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

  const { data: booksData, error } = await getSupabaseServer()
    .from('Book')
    .select('id, title, author, category, coverImageUrl, publishedYear, totalCopies, availableCopies, reviews:Review(rating)')
    .or('ownerId.is.null,lendable.eq.true')
    .order('createdAt', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
    return <HomeView books={[]} sessionUser={sessionUser} banners={[]} />;
  }

  const books = (booksData || []).map((book: any) => {
    const reviews = book.reviews || [];
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviews.length
        : undefined;

    return {
      ...book,
      averageRating,
      reviewCount: reviews.length,
    };
  });

  const { data: bannersData } = await getSupabaseServer()
    .from('Banner')
    .select('*')
    .eq('isActive', true)
    .order('order', { ascending: true })
    .order('createdAt', { ascending: false });

  const banners = (bannersData || []).map((b) => ({
    ...b,
    order: b.order ?? 0,
    isActive: b.isActive ?? true,
  }));

  return <HomeView books={books} sessionUser={sessionUser} banners={banners} />;
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
