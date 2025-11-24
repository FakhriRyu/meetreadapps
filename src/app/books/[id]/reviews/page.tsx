import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getSupabaseServer } from "@/lib/supabase";
import { ReviewList } from "@/components/reviews/review-list";

type ReviewsPageProps = {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ page?: string }>;
};

export default async function ReviewsPage(props: ReviewsPageProps) {
    const resolvedParams = await props.params;
    const resolvedSearchParams = await props.searchParams;
    const bookId = Number(resolvedParams.id);
    const page = Number(resolvedSearchParams.page) || 1;
    const pageSize = 10;

    if (Number.isNaN(bookId)) {
        notFound();
    }

    const supabase = getSupabaseServer();

    // Fetch book details for header
    const { data: book, error: bookError } = await supabase
        .from("Book")
        .select("id, title, author, coverImageUrl")
        .eq("id", bookId)
        .single();

    if (bookError || !book) {
        notFound();
    }

    // Fetch reviews with pagination
    const { data: reviews, count, error: reviewsError } = await supabase
        .from("Review")
        .select(
            `
      id,
      rating,
      comment,
      createdAt,
      user:User(id, name, profileImage)
    `,
            { count: "exact" }
        )
        .eq("bookId", bookId)
        .order("createdAt", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

    if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
        return <div>Terjadi kesalahan saat memuat ulasan.</div>;
    }

    const totalPages = count ? Math.ceil(count / pageSize) : 0;

    return (
        <div className="min-h-screen bg-[#f5f7ff] px-6 pb-20 pt-10 text-slate-900">
            <div className="mx-auto max-w-3xl">
                <Link
                    href={`/books/${bookId}`}
                    className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600"
                >
                    ←
                </Link>

                <div className="mb-8 flex items-center gap-4">
                    <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                        {book.coverImageUrl ? (
                            <Image
                                src={book.coverImageUrl}
                                alt={book.title}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                                No Cover
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Semua Ulasan</h1>
                        <p className="text-sm text-slate-600">{book.title}</p>
                        <p className="text-xs text-slate-500">oleh {book.author}</p>
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100">
                    {reviews && reviews.length > 0 ? (
                        <ReviewList reviews={reviews} />
                    ) : (
                        <p className="text-center text-slate-500">Belum ada ulasan.</p>
                    )}
                </div>

                {totalPages > 1 && (
                    <div className="mt-8 flex justify-center gap-2">
                        {page > 1 && (
                            <Link
                                href={`/books/${bookId}/reviews?page=${page - 1}`}
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                            >
                                Sebelumnya
                            </Link>
                        )}
                        <span className="flex items-center px-4 text-sm text-slate-500">
                            Halaman {page} dari {totalPages}
                        </span>
                        {page < totalPages && (
                            <Link
                                href={`/books/${bookId}/reviews?page=${page + 1}`}
                                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                            >
                                Selanjutnya
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
