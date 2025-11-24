"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Review = {
    id: number;
    rating: number;
    comment: string;
    createdAt: string;
    user: {
        id: string;
        name: string;
        profileImage: string | null;
    };
    book?: {
        title: string;
        coverImageUrl: string;
    };
};

type ReviewManagementPanelProps = {
    initialReviews: Review[];
};

export function ReviewManagementPanel({ initialReviews }: ReviewManagementPanelProps) {
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>(initialReviews);
    const [isLoading, setIsLoading] = useState<number | null>(null);

    const handleDelete = async (reviewId: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus review ini?")) return;

        setIsLoading(reviewId);
        try {
            const response = await fetch(`/api/reviews?id=${reviewId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                throw new Error("Gagal menghapus review");
            }

            setReviews((prev) => prev.filter((r) => r.id !== reviewId));
            router.refresh();
        } catch (error) {
            console.error("Error deleting review:", error);
            alert("Gagal menghapus review");
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {reviews.map((review) => (
                    <div
                        key={review.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-slate-100">
                                    {review.user.profileImage ? (
                                        <Image
                                            src={review.user.profileImage}
                                            alt={review.user.name}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-400">
                                            {review.user.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                                        {review.user.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {new Date(review.createdAt).toLocaleDateString("id-ID", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <svg
                                        key={i}
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill={i < review.rating ? "currentColor" : "none"}
                                        stroke="currentColor"
                                        className={`h-4 w-4 ${i < review.rating ? "text-amber-400" : "text-slate-300"
                                            }`}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                                        />
                                    </svg>
                                ))}
                            </div>

                            <p className="text-sm text-slate-600 line-clamp-3">{review.comment}</p>

                            {review.book && (
                                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                    <div className="relative h-8 w-6 flex-shrink-0 overflow-hidden rounded bg-slate-100">
                                        {review.book.coverImageUrl ? (
                                            <Image src={review.book.coverImageUrl} alt={review.book.title} fill className="object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-400">
                                                {review.book.title.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs font-medium text-slate-700 line-clamp-1">{review.book.title}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleDelete(review.id)}
                            disabled={isLoading === review.id}
                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                        >
                            {isLoading === review.id ? (
                                "Menghapus..."
                            ) : (
                                <>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="h-4 w-4"
                                    >
                                        <path d="M3 6h18" />
                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                    Hapus Review
                                </>
                            )}
                        </button>
                    </div>
                ))}

                {reviews.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="h-8 w-8 text-slate-400"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">Belum ada review</h3>
                        <p className="text-sm text-slate-500">
                            Belum ada pengguna yang memberikan review pada buku koleksi.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
