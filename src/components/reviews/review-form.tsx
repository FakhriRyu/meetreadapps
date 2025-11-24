"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/ui/star-rating";

type ReviewFormProps = {
    bookId: number;
    onSuccess?: () => void;
    initialData?: {
        id: number;
        rating: number;
        comment: string;
    };
};

export function ReviewForm({ bookId, onSuccess, initialData }: ReviewFormProps) {
    const router = useRouter();
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [comment, setComment] = useState(initialData?.comment || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (rating === 0) {
            setError("Silakan berikan rating terlebih dahulu.");
            return;
        }

        if (comment.trim().length < 3) {
            setError("Komentar minimal 3 karakter.");
            return;
        }

        setIsSubmitting(true);

        try {
            const method = initialData ? "PUT" : "POST";
            const body = initialData
                ? { id: initialData.id, rating, comment }
                : { bookId, rating, comment };

            const response = await fetch("/api/reviews", {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Gagal mengirim review.");
            }

            if (!initialData) {
                setRating(0);
                setComment("");
            }
            router.refresh();
            if (onSuccess) {
                onSuccess();
            }
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Terjadi kesalahan saat mengirim review.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">
                {initialData ? "Edit Review" : "Tulis Review"}
            </h3>

            <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Rating</label>
                <div className="flex items-center gap-2">
                    <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                    <span className="text-sm font-medium text-slate-500">
                        {rating > 0 ? `${rating} dari 5` : "Pilih rating"}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <label htmlFor="comment" className="block text-sm font-medium text-slate-700">
                    Komentar
                </label>
                <textarea
                    id="comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Bagaimana pendapatmu tentang buku ini?"
                    className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
            >
                {isSubmitting ? "Mengirim..." : initialData ? "Simpan Perubahan" : "Kirim Review"}
            </button>
        </form>
    );
}
