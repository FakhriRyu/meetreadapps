
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AddReviewButton } from "@/components/silent-reading/add-review-button";
import { SafeImage } from "@/components/ui/safe-image";
import { SilentReadingReviewCard } from "@/components/silent-reading/silent-reading-review-card";

export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data: event } = await getSupabaseServer()
        .from('SilentReadingEvent')
        .select('title')
        .eq('id', parseInt(id))
        .single();

    return {
        title: event ? `${event.title} - Silent Reading` : 'Silent Reading Event',
    };
}

import { JoinButton } from "@/components/silent-reading/join-button";

// Safe date formatter to prevent crashes
const safeFormatDate = (dateString: string | undefined | null, formatStr: string) => {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';
        return format(date, formatStr, { locale: idLocale });
    } catch (e) {
        console.error("Date formatting error:", e);
        return '-';
    }
};

async function EventDetails({ id }: { id: string }) {
    const sessionUser = await getSessionUser();
    const supabase = getSupabaseServer();
    const eventId = parseInt(id);

    if (isNaN(eventId)) {
        notFound();
    }

    const { data: event, error: eventError } = await supabase
        .from('SilentReadingEvent')
        .select('*')
        .eq('id', eventId)
        .single();

    if (eventError || !event) {
        notFound();
    }

    // Check participation
    let isJoined = false;
    if (sessionUser) {
        const { data: participation } = await supabase
            .from('SilentReadingParticipant')
            .select('id')
            .eq('event_id', event.id)
            .eq('user_id', sessionUser.id)
            .single();

        if (participation) {
            isJoined = true;
        }
    }

    const { data: reviews, error: reviewsError } = await supabase
        .from('SilentReadingReview')
        .select(`
        *,
        user:User!SilentReadingReview_userId_fkey(id, name, profileImage),
        book:Book!SilentReadingReview_bookId_fkey(id, title, coverImageUrl, author)
    `)
        .eq('eventId', eventId)
        .order('createdAt', { ascending: false });

    if (reviewsError) {
        console.error("Error fetching reviews", reviewsError);
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="relative h-64 w-full bg-slate-100">
                    <SafeImage
                        src={event.coverImageUrl || ''}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                        fallbackContent={
                            <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-300">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16">
                                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                    <circle cx="9" cy="9" r="2" />
                                    <path d="m21 15-3.086-3.086a2 0 0 0-2.828 0L6 21" />
                                </svg>
                            </div>
                        }
                    />
                </div>
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${event.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {event.isActive ? 'Sedang Berlangsung' : 'Selesai'}
                        </span>
                        <span className="text-sm text-slate-500">
                            {safeFormatDate(event.startDate, 'EEEE, d MMMM yyyy')}
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>
                    <p className="mt-4 whitespace-pre-line text-slate-600">{event.description}</p>
                </div>
            </header>

            <section>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Ulasan & Aktivitas ({reviews?.length || 0})</h2>
                    {/* Only show actions if event is active */}
                    {event.isActive ? (
                        <>
                            {sessionUser && isJoined ? (
                                <AddReviewButton
                                    eventId={event.id}
                                    userId={sessionUser.id}
                                    hasReviewed={reviews?.some(review => (review.user as any)?.id === sessionUser.id) ?? false}
                                    existingReview={reviews?.find(review => (review.user as any)?.id === sessionUser.id)}
                                />
                            ) : sessionUser ? (
                                <JoinButton eventId={event.id} userId={sessionUser.id} />
                            ) : (
                                <Link href="/login" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                                    Login untuk bergabung
                                </Link>
                            )}
                        </>
                    ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                            Event Telah Selesai
                        </span>
                    )}
                </div>

                {/* Sticky Board Layout */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {reviews?.map((review, index) => (
                        <SilentReadingReviewCard key={review.id} review={review} index={index} />
                    ))}
                </div>
                {(!reviews || reviews.length === 0) && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                            <span className="text-2xl">✍️</span>
                        </div>
                        <h3 className="font-semibold text-slate-900">Belum ada ulasan</h3>
                        <p className="mt-1 text-sm text-slate-500">Jadilah yang pertama membagikan cerita!</p>
                    </div>
                )}

            </section >
        </div >
    );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return (
        <div className="min-h-screen bg-[#f5f7ff] pb-24 text-slate-900">
            <main className="mx-auto flex w-full max-w-xl flex-col px-6 pt-8">
                <Link href="/silent-reading" className="mb-6 inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="m15 18-6-6 6-6" /></svg>
                    Kembali ke daftar jadwal
                </Link>
                <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
                    <EventDetails id={id} />
                </Suspense>
            </main>
        </div>
    )
}
