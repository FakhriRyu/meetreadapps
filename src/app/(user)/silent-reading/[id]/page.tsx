
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AddReviewButton } from "@/components/silent-reading/add-review-button";
import { SafeImage } from "@/components/ui/safe-image";

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

                {reviews?.map((review) => {
                    // Extract content details based on entry type
                    let title = '';
                    let subtitle = '';
                    let coverUrl = '';
                    let isBook = false;

                    if (review.entryType === 'BOOK_DB' && (review.book as any)) {
                        title = (review.book as any).title;
                        subtitle = (review.book as any).author;
                        coverUrl = (review.book as any).coverImageUrl;
                        isBook = true;
                    } else if (review.entryType === 'BOOK_MANUAL' && (review.manualData as any)) {
                        title = (review.manualData as any).title || 'Judul Buku';
                        subtitle = (review.manualData as any).author || 'Penulis';
                        coverUrl = (review.manualData as any).coverUrl;
                        isBook = true;
                    } else if (review.entryType === 'TOPIC') {
                        title = (review.manualData as any)?.topicTitle || 'Topik Diskusi';
                        subtitle = 'Diskusi Grup';
                        isBook = false;
                    }

                    return (
                        <div key={review.id} className="group relative flex flex-row gap-3 overflow-hidden rounded-3xl border border-slate-100 bg-white p-3 shadow-[0_2px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] sm:gap-4 sm:p-4">
                            {/* Left Bento Block: Cover/Icon */}
                            <div className="relative aspect-[2/3] w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-28 sm:rounded-2xl">
                                {isBook ? (
                                    <SafeImage
                                        src={coverUrl || '/placeholder.png'}
                                        alt={title}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                        fallbackContent={
                                            <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                            </div>
                                        }
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-orange-50 text-orange-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                )}
                            </div>

                            {/* Right Bento Block: Content */}
                            <div className="flex min-w-0 flex-1 flex-col">
                                {/* Header: User & Meta */}
                                <div className="mb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200 ring-2 ring-white">
                                            <SafeImage
                                                src={(review.user as any)?.profileImage || ''}
                                                alt={(review.user as any)?.name || 'User'}
                                                width={32}
                                                height={32}
                                                className="h-full w-full object-cover"
                                                fallbackContent={
                                                    <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-xs font-bold text-indigo-600">
                                                        {(review.user as any)?.name?.substring(0, 2).toUpperCase() || 'U'}
                                                    </div>
                                                }
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-slate-900 line-clamp-1">{(review.user as any)?.name || 'Pengguna'}</span>
                                            <span className="text-[10px] text-slate-400 font-medium">{safeFormatDate(review.createdAt, 'd MMM, HH:mm')}</span>
                                        </div>
                                    </div>

                                    {/* Status / Rating Badge */}
                                    <div className="flex items-center gap-2">
                                        {review.status === 'FINISHED' && (review.manualData as any)?.rating > 0 && (
                                            <div className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-600 border border-amber-100">
                                                <span>⭐</span>
                                                <span>{(review.manualData as any)?.rating}</span>
                                            </div>
                                        )}
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-semibold border ${review.status === 'READING'
                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                            : review.status === 'FINISHED'
                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                : 'bg-orange-50 text-orange-600 border-orange-100' // Discussion
                                            }`}>
                                            {review.status === 'READING' ? 'Sedang Baca' : review.status === 'FINISHED' ? 'Selesai' : 'Diskusi'}
                                        </span>
                                    </div>
                                </div>

                                {/* Title Info */}
                                <div className="mb-3">
                                    <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{title}</h3>
                                    <p className="text-xs font-medium text-slate-500">{subtitle}</p>
                                </div>

                                {/* Review Bubble */}
                                <div className="relative mt-auto rounded-2xl bg-slate-50 p-3.5 text-sm leading-relaxed text-slate-600 group-hover:bg-slate-100/80 transition-colors">
                                    {/* Little arrow/tail for the bubble */}
                                    <div className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 bg-slate-50 group-hover:bg-slate-100/80 transition-colors"></div>
                                    {review.reviewText}
                                </div>
                            </div>
                        </div>
                    );
                })}
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
