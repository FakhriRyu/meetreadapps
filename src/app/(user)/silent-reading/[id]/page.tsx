
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { AddReviewButton } from "@/components/silent-reading/add-review-button";

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
                    {event.coverImageUrl ? (
                        <Image
                            src={event.coverImageUrl}
                            alt={event.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-300">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="h-16 w-16">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                        </div>
                    )}
                </div>
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${event.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {event.isActive ? 'Sedang Berlangsung' : 'Selesai'}
                        </span>
                        <span className="text-sm text-slate-500">
                            {format(new Date(event.startDate), 'EEEE, d MMMM yyyy', { locale: idLocale })}
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                    {reviews?.map((review) => (
                        <div key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            {/* User info */}
                            <div className="mb-3 flex items-center gap-3">
                                <div className="h-8 w-8 overflow-hidden rounded-full bg-slate-200">
                                    {(review.user as any)?.profileImage ? (
                                        <Image src={(review.user as any).profileImage} alt={(review.user as any).name} width={32} height={32} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-xs font-bold text-indigo-600">
                                            {(review.user as any)?.name?.substring(0, 2).toUpperCase() || 'U'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">{(review.user as any)?.name || 'Pengguna'}</p>
                                    <p className="text-xs text-slate-500">{review.createdAt ? format(new Date(review.createdAt), 'd MMM HH:mm', { locale: idLocale }) : '-'}</p>
                                </div>
                            </div>

                            {/* Book/Topic Info */}
                            <div className="mb-3 flex gap-3 rounded-xl bg-slate-50 p-3">
                                {review.entryType === 'BOOK_DB' && (review.book as any) && (
                                    <>
                                        <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-md bg-slate-200 relative">
                                            <Image
                                                src={(review.book as any).coverImageUrl || '/placeholder.png'}
                                                alt={(review.book as any).title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-900">{(review.book as any).title}</p>
                                            <p className="truncate text-xs text-slate-500">{(review.book as any).author}</p>
                                            <span className="mt-1.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                                                {review.status === 'READING' ? 'Sedang Membaca' : 'Selesai Membaca'}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {review.entryType === 'BOOK_MANUAL' && (
                                    <>
                                        <div className="h-16 w-12 flex-shrink-0 overflow-hidden rounded-md bg-slate-200 relative">
                                            {(review.manualData as any)?.coverUrl && (
                                                <img src={(review.manualData as any).coverUrl} alt={(review.manualData as any).title} className="h-full w-full object-cover" />
                                            )}
                                            {!(review.manualData as any)?.coverUrl && (
                                                <div className="flex h-full w-full items-center justify-center text-xl">📚</div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-slate-900">{(review.manualData as any)?.title || 'Judul Buku'}</p>
                                            <p className="truncate text-xs text-slate-500">{(review.manualData as any)?.author || 'Penulis'}</p>
                                            <span className="mt-1.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
                                                {review.status === 'READING' ? 'Sedang Membaca' : 'Selesai Membaca'}
                                            </span>
                                        </div>
                                    </>
                                )}
                                {review.entryType === 'TOPIC' && (
                                    <div className="flex w-full items-start gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{(review.manualData as any)?.topicTitle || 'Topik Diskusi'}</p>
                                            <span className="mt-1 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
                                                Diskusi
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Review Text */}
                            <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">{review.reviewText}</p>
                        </div>
                    ))}
                    {(!reviews || reviews.length === 0) && (
                        <div className="py-12 text-center">
                            <p className="text-slate-500">Belum ada ulasan. Bergabunglah dan jadilah yang pertama!</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
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
