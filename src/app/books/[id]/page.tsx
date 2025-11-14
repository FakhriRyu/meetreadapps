// @ts-nocheck - Migrated to Supabase
import { notFound } from "next/navigation";

import { BookDetailView } from "@/components/books/book-detail-view";
import { getSupabaseServer } from "@/lib/supabase";
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

  const supabase = getSupabaseServer();
  const sessionUser = await getSessionUser();

  const { data: book, error } = await supabase
    .from('Book')
    .select(`
      *,
      owner:User!Book_ownerId_fkey(id, name, phoneNumber),
      borrower:User!Book_borrowerId_fkey(id, name),
      requests:BorrowRequest(
        status,
        createdAt,
        requester:User!BorrowRequest_requesterId_fkey(name)
      )
    `)
    .eq('id', bookId)
    .single();

  if (error || !book) {
    notFound();
  }

  // Filter and sort requests
  const activeRequests = (book.requests || [])
    .filter((r: any) => r.status === 'PENDING' || r.status === 'APPROVED')
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const lastRequest = activeRequests[0] ?? null;
  const lastRequestStatus = lastRequest?.status;

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
        createdAt: book.createdAt,
        lendable: book.lendable,
        status: book.status,
        ownerName: book.owner?.name ?? "",
        ownerPhone: book.owner?.phoneNumber ?? "",
        borrowerName: book.borrower?.name ?? "",
        dueDate: book.dueDate ?? null,
        lastRequesterName: lastRequest?.requester?.name ?? "",
        lastRequestStatus,
      }}
      sessionUser={sessionUser}
    />
  );
}
