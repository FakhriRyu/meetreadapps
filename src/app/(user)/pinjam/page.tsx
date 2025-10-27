import { Suspense } from "react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { PinjamView } from "@/components/user/pinjam-view";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type PinjamPageProps = {
  searchParams: Promise<{ page?: string; query?: string }>;
};

export default async function PinjamPage(props: PinjamPageProps) {
  const [sessionUser, searchParams] = await Promise.all([getSessionUser(), props.searchParams]);

  const page = Number(searchParams.page ?? "1");
  if (Number.isNaN(page) || page < 1) {
    notFound();
  }

  const query = (searchParams.query ?? "").trim().toLowerCase();

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
    // redirect to last page via notFound followed by client side handling
    notFound();
  }

  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
