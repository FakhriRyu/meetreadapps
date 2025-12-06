
"use client";

import { useState } from "react";
import { ReviewModal } from "./review-modal";

type AddReviewButtonProps = {
    eventId: number;
    userId: number;
    hasReviewed?: boolean;
    existingReview?: any;
};

export function AddReviewButton({ eventId, userId, hasReviewed = false, existingReview }: AddReviewButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => (!hasReviewed || existingReview) && setIsModalOpen(true)}
                disabled={hasReviewed && !existingReview}
                className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition
                    ${hasReviewed && !existingReview
                        ? 'bg-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200'
                    }`}
            >
                {existingReview ? (
                    <>
                        <span className="mr-2 text-lg leading-none">✎</span>
                        Edit Ulasan
                    </>
                ) : hasReviewed ? (
                    <>
                        <span className="mr-2 text-lg leading-none">✓</span>
                        Ulasan Terkirim
                    </>
                ) : (
                    <>
                        <span className="mr-2 text-lg leading-none">＋</span>
                        Tulis Ulasan
                    </>
                )}
            </button>

            <ReviewModal
                eventId={eventId}
                userId={userId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => setIsModalOpen(false)}
                initialData={existingReview}
            />
        </>
    );
}
