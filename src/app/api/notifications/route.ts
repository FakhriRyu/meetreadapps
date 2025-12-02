// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET(request: NextRequest) {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
        return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const { data: notifications, error } = await supabase
        .from('BorrowNotification')
        .select(`
      id,
      type,
      message,
      createdAt,
      isRead,
      request:BorrowRequest!BorrowNotification_requestId_fkey(
        id,
        book:Book!BorrowRequest_bookId_fkey(
          title,
          coverImageUrl
        )
      )
    `)
        .eq('request.requesterId', sessionUser.id)
        .order('createdAt', { ascending: false });

    if (error) {
        console.error("Error fetching notifications:", error);
        return NextResponse.json({ error: "Gagal mengambil notifikasi." }, { status: 500 });
    }

    // Filter notifications where the related request belongs to the user
    // Since we can't easily join-filter in one go with the current setup without complex RLS or views,
    // we'll filter in memory or rely on the join if it works as expected.
    // Ideally, BorrowNotification should have a userId column for easier querying.
    // For now, let's assume the join works or we filter here.

    // Actually, the query above might return all notifications if the join filter isn't applied correctly on the top level.
    // Let's refine the query. BorrowNotification is linked to BorrowRequest. BorrowRequest has requesterId.
    // We want notifications for requests made by the user.

    // Correct approach with Supabase/PostgREST for nested filtering:
    // .eq('request.requesterId', sessionUser.id) might not work directly on the top level resource without !inner join.

    const { data: userNotifications, error: userNotifError } = await supabase
        .from('BorrowNotification')
        .select(`
      id,
      type,
      message,
      createdAt,
      isRead,
      request:BorrowRequest!inner(
        id,
        requesterId,
        book:Book(
          title,
          coverImageUrl
        )
      )
    `)
        .eq('request.requesterId', sessionUser.id)
        .order('createdAt', { ascending: false });

    if (userNotifError) {
        console.error("Error fetching user notifications:", userNotifError);
        return NextResponse.json({ error: "Gagal mengambil notifikasi." }, { status: 500 });
    }

    return NextResponse.json({ data: userNotifications });
}

export async function PATCH(request: NextRequest) {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
        return NextResponse.json({ error: "Anda harus masuk terlebih dahulu." }, { status: 401 });
    }

    const supabase = getSupabaseServer();

    // We need to find IDs of notifications to update first, or use a subquery approach if supported.
    // Simpler: Fetch unread notifications for this user first.

    const { data: unread, error: fetchError } = await supabase
        .from('BorrowNotification')
        .select(`
      id,
      request:BorrowRequest!inner(
        requesterId
      )
    `)
        .eq('request.requesterId', sessionUser.id)
        .eq('isRead', false);

    if (fetchError) {
        return NextResponse.json({ error: "Gagal memproses notifikasi." }, { status: 500 });
    }

    const idsToUpdate = unread.map((n: any) => n.id);

    if (idsToUpdate.length > 0) {
        const { error: updateError } = await supabase
            .from('BorrowNotification')
            .update({ isRead: true })
            .in('id', idsToUpdate);

        if (updateError) {
            return NextResponse.json({ error: "Gagal memperbarui status notifikasi." }, { status: 500 });
        }
    }

    return NextResponse.json({ success: true });
}
