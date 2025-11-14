import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { supabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
import { PinjamView } from "@/components/user/pinjam-view";

// Revalidate cache setiap 20 detik
export const revalidate = 20;

// Metadata untuk SEO
export const metadata = {
  title: "Pinjam Buku - MeetRead",
  description: "Cari dan pinjam buku yang kamu inginkan",
};

type PinjamPageProps = {
  searchParams: Promise<{ page?: string; query?: string }>;
};

async function BooksData(props: PinjamPageProps) {
  const [sessionUser, searchParams] = await Promise.all([getSessionUser(), props.searchParams]);

  const page = Number(searchParams.page ?? "1");
  if (Number.isNaN(page) || page < 1) {
    notFound();
  }

  const query = (searchParams.query ?? "").trim();
  const pageSize = 10;

  // Build query
  let booksQuery = supabaseServer
    .from('Book')
    .select('*', { count: 'exact' })
    .neq('status', 'UNAVAILABLE');

  // Add search filter if query exists
  if (query.length > 0) {
    booksQuery = booksQuery.or(`title.ilike.%${query}%,author.ilike.%${query}%,category.ilike.%${query}%`);
  }

  // Execute query with pagination
  const { data: books, error, count } = await booksQuery
    .order('createdAt', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error('Error fetching books:', error);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  if (currentPage !== page) {
    const params = new URLSearchParams();
    if (currentPage > 1) {
      params.set("page", String(currentPage));
    }
    if (query.length > 0) {
      params.set("query", query);
    }
    redirect(`/pinjam${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <PinjamView
      books={books || []}
      sessionUser={sessionUser}
      pageInfo={{
        totalCount,
        currentPage,
        totalPages,
        pageSize,
        query,
      }}
    />
  );
}

export default async function PinjamPage(props: PinjamPageProps) {
  return (
    <Suspense fallback={<PinjamLoading />}>
      <BooksData {...props} />
    </Suspense>
  );
}

function PinjamLoading() {
  return (
    <div className="min-h-screen bg-[#f5f7ff] px-6 pb-24 pt-10 text-slate-900">
      <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mt-8 space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
