import { notFound, redirect } from "next/navigation";

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
            { title: { contains: query, mode: "insensitive" } },
            { author: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
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
