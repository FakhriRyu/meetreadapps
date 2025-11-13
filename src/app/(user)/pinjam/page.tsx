import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PinjamView } from "@/components/user/pinjam-view";
import { Prisma } from "@prisma/client";

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

  const whereClause: Prisma.BookWhereInput = {
    status: { not: "UNAVAILABLE" },
    ...(query.length > 0
      ? {
          OR: [
            { title: { contains: query } },
            { author: { contains: query } },
            { category: { contains: query } },
          ],
        }
      : undefined),
  };

  const pageSize = 10;
  const [totalCount, books] = await Promise.all([
    prisma.book.count({ where: whereClause }),
    prisma.book.findMany({
      where: whereClause,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

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
      books={books}
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
