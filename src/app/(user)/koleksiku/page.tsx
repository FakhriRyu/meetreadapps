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
  const { data: collections, error: collectionsError } = await supabaseServer
    .from('Book')
    .select('*')
    .eq('ownerId', sessionUser.id)
    .order('createdAt', { ascending: false });

  // Fetch requests with joins
  const { data: requestsData, error: requestsError } = await supabaseServer
    .from('BorrowRequest')
    .select(`
      *,
      book:Book!BorrowRequest_bookId_fkey(
        id,
        title,
        status,
        dueDate,
        availableCopies,
        totalCopies,
        lendable,
        ownerId
      ),
      requester:User!BorrowRequest_requesterId_fkey(
        id,
        name,
        email,
        phoneNumber
      )
    `)
    .in('status', ['PENDING', 'APPROVED'])
    .order('createdAt', { ascending: false });

  // Filter requests to only include books owned by current user
  const requests = (requestsData || []).filter(
    (req: any) => req.book?.ownerId === sessionUser.id
  );

  if (collectionsError) {
    console.error('Error fetching collections:', collectionsError);
  }
  if (requestsError) {
    console.error('Error fetching requests:', requestsError);
  }

  return <KoleksikuView collections={collections || []} requests={requests} />;
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
