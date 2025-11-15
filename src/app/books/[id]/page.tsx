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
  const bookQuery = supabase
    .from('Book')
    .select(`
      id,
      title,
      author,
      description,
      category,
      coverImageUrl,
      totalCopies,
      availableCopies,
      publishedYear,
      createdAt,
      lendable,
      status,
      dueDate,
      owner:User!Book_ownerId_fkey(id, name, phoneNumber),
      borrower:User!Book_borrowerId_fkey(id, name)
    `)
    .eq('id', bookId)
    .single();

  const lastRequestQuery = supabase
    .from('BorrowRequest')
    .select(`
      status,
      createdAt,
      requester:User!BorrowRequest_requesterId_fkey(name)
    `)
    .eq('bookId', bookId)
    .in('status', ['PENDING', 'APPROVED'])
    .order('createdAt', { ascending: false })
    .limit(1)
    .maybeSingle();

  const [sessionUser, { data: book, error: bookError }, { data: lastRequest }] = await Promise.all([
    getSessionUser(),
    bookQuery,
    lastRequestQuery,
  ]);

  if (bookError || !book) {
    notFound();
  }

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
