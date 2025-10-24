import { notFound } from "next/navigation";

import { BookDetailView } from "@/components/books/book-detail-view";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

type BookDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookDetailPage(props: BookDetailPageProps) {
  const resolvedParams = await props.params;
  const bookId = Number(resolvedParams.id);
  if (Number.isNaN(bookId)) {
    notFound();
  }

  const [book, sessionUser] = await Promise.all([
    prisma.book.findUnique({
      where: { id: bookId },
    }),
    getSessionUser(),
  ]);

  if (!book) {
    notFound();
  }

  return (
    <BookDetailView
      book={{
        id: book.id,
        title: book.title,
        author: book.author,
        description: book.description ?? "",
        category: book.category ?? "Umum",
        coverImageUrl: book.coverImageUrl ?? "",
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        publishedYear: book.publishedYear ?? null,
        createdAt: book.createdAt.toISOString(),
        lendable: book.lendable,
      }}
      sessionUser={sessionUser}
    />
  );
}
