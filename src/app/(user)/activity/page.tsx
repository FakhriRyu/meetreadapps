import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
import { ActivityView } from "@/components/activity/activity-view";

export const revalidate = 10;

export const metadata = {
    title: "Aktivitas - MeetRead",
    description: "Pantau status peminjaman dan pengembalian buku",
};

async function ActivityData() {
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
        redirect("/login?from=activity");
    }

    // Fetch incoming requests (requests for my books)
    const { data: incomingRequestsData, error: incomingError } = await getSupabaseServer()
        .from('BorrowRequest')
        .select(`
      *,
      book:Book!BorrowRequest_bookId_fkey(
        id,
        title,
        status,
        dueDate,
        availableCopies,
        totalCopies,
        ownerId,
        coverImageUrl
      ),
      requester:User!BorrowRequest_requesterId_fkey(
        id,
        name,
        email,
        phoneNumber
      )
    `)
        .in('status', ['PENDING', 'APPROVED'])
        .order('createdAt', { ascending: false });

    // Filter requests to only include books owned by current user
    const incomingRequests = (incomingRequestsData || []).filter(
        (req: any) => req.book?.ownerId === sessionUser.id
    );

    // Fetch outgoing requests (my requests)
    const { data: outgoingRequestsData, error: outgoingError } = await getSupabaseServer()
        .from('BorrowRequest')
        .select(`
            *,
            book:Book!BorrowRequest_bookId_fkey(
                id,
                title,
                status,
                dueDate,
                availableCopies,
                totalCopies,
                ownerId,
                coverImageUrl,
                owner:User!Book_ownerId_fkey(
                    name,
                    phoneNumber
                )
            ),
            requester:User!BorrowRequest_requesterId_fkey(
                id,
                name,
                email,
                phoneNumber
            )
        `)
        .eq('requesterId', sessionUser.id)
        .order('createdAt', { ascending: false });

    const outgoingRequests = outgoingRequestsData || [];

    // Filter active loans (APPROVED status)
    const activeLoans = outgoingRequests.filter(
        (req) => req.status === 'APPROVED'
    );

    if (incomingError) {
        console.error('Error fetching incoming requests:', incomingError);
    }
    if (outgoingError) {
        console.error('Error fetching outgoing requests:', outgoingError);
    }

    return (
        <ActivityView
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            activeLoans={activeLoans}
        />
    );
}

export default function ActivityPage() {
    return (
        <Suspense fallback={<ActivityLoading />}>
            <ActivityData />
        </Suspense>
    );
}

function ActivityLoading() {
    return (
        <div className="min-h-screen bg-[#f5f7ff] px-6 pb-28 pt-10 text-slate-900">
            <div className="h-7 w-32 animate-pulse rounded-full bg-slate-300" />
            <div className="mt-8 h-12 animate-pulse rounded-2xl bg-slate-100" />
        </div>
    );
}
