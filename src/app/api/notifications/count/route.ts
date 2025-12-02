// @ts-nocheck - TODO: Migrate to Supabase
import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/session";
import { getSupabaseServer } from "@/lib/supabase";

export const revalidate = 0;

export async function GET(request: NextRequest) {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
        return NextResponse.json({ count: 0 });
    }

    const supabase = getSupabaseServer();

    const { count, error } = await supabase
        .from('BorrowNotification')
        .select(`
      id,
      request:BorrowRequest!inner(
        requesterId
      )
    `, { count: 'exact', head: true })
        .eq('request.requesterId', sessionUser.id)
        .eq('isRead', false);

    if (error) {
        console.error("Error fetching notification count:", error);
        return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count ?? 0 });
}
