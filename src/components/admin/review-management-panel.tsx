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
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    const filteredReviews = reviews.filter((review) => {
        const query = searchQuery.toLowerCase();
        return (
            review.comment.toLowerCase().includes(query) ||
            review.user.name.toLowerCase().includes(query) ||
            (review.book?.title.toLowerCase().includes(query) ?? false)
        );
    });

    const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);
    const paginatedReviews = filteredReviews.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

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
            {/* Search Bar */}
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg
                        className="h-5 w-5 text-slate-400"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                            clipRule="evenodd"
                        />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Cari review berdasarkan komentar, nama user, atau judul buku..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page on search
                    }}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedReviews.map((review) => (
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

                {filteredReviews.length === 0 && (
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
                                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                                />
                            </svg>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">Tidak ada review ditemukan</h3>
                        <p className="text-sm text-slate-500">
                            Coba kata kunci lain atau hapus filter pencarian.
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-5 w-5"
                        >
                            <path
                                fillRule="evenodd"
                                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                        Sebelumnya
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">
                            Halaman <span className="font-medium text-slate-900">{currentPage}</span> dari{" "}
                            <span className="font-medium text-slate-900">{totalPages}</span>
                        </span>
                    </div>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                        Selanjutnya
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="h-5 w-5"
                        >
                            <path
                                fillRule="evenodd"
                                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
}
