"use client";

import { SafeImage } from "@/components/ui/safe-image";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { StarRating } from "@/components/ui/star-rating";

type Review = {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
        id: number;
        name: string | null;
        profileImage: string | null;
    };
};

type ReviewListProps = {
    reviews: Review[];
    sessionUser?: { id: number } | null;
    onEdit?: (review: Review) => void;
};

export function ReviewList({ reviews, sessionUser, onEdit }: ReviewListProps) {
    if (reviews.length === 0) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                Belum ada review untuk buku ini. Jadilah yang pertama memberikan review!
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map((review) => (
                <div key={review.id} className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-100 transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
                                <SafeImage
                                    src={review.user.profileImage || ''}
                                    alt={review.user.name ?? "User"}
                                    fill
                                    className="object-cover"
                                    fallbackContent={
                                        <div className="flex h-full w-full items-center justify-center bg-indigo-100 text-sm font-bold text-indigo-600">
                                            {(review.user.name ?? "U").charAt(0).toUpperCase()}
                                        </div>
                                    }
                                />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{review.user.name ?? "Pengguna"}</p>
                                <div className="mt-1">
                                    <StarRating rating={review.rating} readOnly size="sm" />
                                </div>
                            </div>
                        </div>
                        {sessionUser?.id === review.user.id && onEdit && (
                            <button
                                onClick={() => onEdit(review)}
                                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-indigo-600"
                                aria-label="Edit review"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                        )}
                    </div>

                    <p className="text-sm leading-relaxed text-slate-600">
                        &quot;{review.comment}&quot;
                    </p>

                    <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-400">

                            {(() => {
                                try {
                                    return formatDistanceToNow(new Date(review.createdAt), { addSuffix: true, locale: id });
                                } catch {
                                    return 'Baru saja';
                                }
                            })()}
                        </span>
                        {/* Decorative arrow similar to the design */}
                        <div className="text-slate-300">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
