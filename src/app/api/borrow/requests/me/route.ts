// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase";
import { BookStatus } from "@/types/enums";

export async function GET(request: NextRequest) {
  const sessionUser = await getSessionUser();

  if (!sessionUser) {
    return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = limitParam ? Number(limitParam) : undefined;
  const take = Number.isFinite(limit) && limit && limit > 0 ? limit : undefined;

  const supabase = getSupabaseServer();
  let query = supabase
    .from('BorrowRequest')
    .select(`
      id,
      status,
      message,
      ownerMessage,
      ownerDecisionAt,
      createdAt,
      updatedAt,
      whatsappUrl,
      book:Book!BorrowRequest_bookId_fkey(
        id,
        title,
        coverImageUrl,
        status,
        dueDate,
        owner:User!Book_ownerId_fkey(
          id,
          name
        )
      )
    `)
    .eq('requesterId', sessionUser.id)
    .order('createdAt', { ascending: false });

  if (take) {
    query = query.limit(take);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Gagal mengambil riwayat permintaan." }, { status: 500 });
  }

  const payload = (data ?? []).map((request: any) => ({
    id: request.id,
    status: request.status,
    message: request.message,
    ownerMessage: request.ownerMessage,
    ownerDecisionAt: request.ownerDecisionAt ?? null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    whatsappUrl: request.whatsappUrl,
    book: {
      id: request.book?.id ?? 0,
      title: request.book?.title ?? "",
      coverImageUrl: request.book?.coverImageUrl ?? null,
      status: request.book?.status ?? BookStatus.PENDING,
      dueDate: request.book?.dueDate ?? null,
      ownerName: request.book?.owner?.name ?? "Pemilik",
    },
  }));

  return NextResponse.json({ data: payload });
}
