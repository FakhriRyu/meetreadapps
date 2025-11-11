import { notFound } from "next/navigation";

import { BookDetailView } from "@/components/books/book-detail-view";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";

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
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        borrower: {
          select: {
            id: true,
            name: true,
          },
        },
        requests: {
          where: {
            status: { in: ["PENDING", "APPROVED"] },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            requester: {
              select: { name: true },
            },
          },
        },
      },
    }),
    getSessionUser(),
  ]);

  if (!book) {
    notFound();
  }

  const lastRequest = book.requests?.[0] ?? null;
  const lastRequestStatus =
    lastRequest && (lastRequest.status === "PENDING" || lastRequest.status === "APPROVED")
      ? lastRequest.status
      : undefined;

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
        status: book.status,
        ownerName: book.owner?.name ?? "",
        ownerPhone: book.owner?.phoneNumber ?? "",
        borrowerName: book.borrower?.name ?? "",
        dueDate: book.dueDate ? book.dueDate.toISOString() : null,
        lastRequesterName: book.requests?.[0]?.requester.name ?? "",
        lastRequestStatus,
      }}
      sessionUser={sessionUser}
    />
  );
}
