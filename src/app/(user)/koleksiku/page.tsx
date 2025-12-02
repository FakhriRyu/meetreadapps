import { Suspense } from "react";
import { redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
import { KoleksikuView } from "@/components/koleksiku/koleksiku-view";

// Revalidate cache setiap 10 detik karena data lebih dinamis
export const revalidate = 10;

// Metadata untuk SEO
export const metadata = {
  title: "Koleksiku - MeetRead",
  description: "Kelola koleksi buku dan permintaan peminjamanmu",
};

async function CollectionData() {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    redirect("/login?from=koleksiku");
  }

  // Fetch collections
  const { data: collectionsData, error: collectionsError } = await supabaseServer
    .from('Book')
    .select('*, reviews:Review(rating)')
    .eq('ownerId', sessionUser.id)
    .order('createdAt', { ascending: false });

  const collections = (collectionsData || []).map((book: any) => {
    const reviews = book.reviews || [];
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / reviews.length
        : undefined;

    return {
      ...book,
      averageRating,
    };
  });

  if (collectionsError) {
    console.error('Error fetching collections:', collectionsError);
  }

  return <KoleksikuView collections={collections} />;
}

export default function KoleksikuPage() {
  return (
    <Suspense fallback={<KoleksikuLoading />}>
      <CollectionData />
    </Suspense>
  );
}

function KoleksikuLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
      <div className="h-7 w-32 animate-pulse rounded-full bg-slate-300" />
      <div className="mt-8 h-12 animate-pulse rounded-2xl bg-slate-100" />
    </div>
  );
}
