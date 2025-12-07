
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { StarRating } from "@/components/ui/star-rating";

type ReviewModalProps = {
    eventId: number;
    userId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: any; // Accepting existing review data
};

type EntryType = 'BOOK_DB' | 'BOOK_MANUAL' | 'TOPIC';
type Status = 'READING' | 'FINISHED';

type BookResult = {
    id: number;
    title: string;
    author: string;
    coverImageUrl: string | null;
};

export function ReviewModal({ eventId, userId, isOpen, onClose, onSuccess, initialData }: ReviewModalProps) {
    const [entryType, setEntryType] = useState<EntryType>('BOOK_DB');
    const [reviewText, setReviewText] = useState("");
    const [status, setStatus] = useState<Status>('READING');
    const [rating, setRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // BOOK_DB
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<BookResult[]>([]);
    const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // BOOK_MANUAL
    const [manualTitle, setManualTitle] = useState("");
    const [manualAuthor, setManualAuthor] = useState("");
    const [manualCoverUrl, setManualCoverUrl] = useState("");

    // TOPIC
    const [topicTitle, setTopicTitle] = useState("");

    const supabase = createSupabaseClient();
    const router = useRouter();

    // Search logic
    useEffect(() => {
        if (!searchQuery.trim() || entryType !== 'BOOK_DB') {
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            const { data, error } = await supabase
                .from('Book')
                .select('id, title, author, coverImageUrl')
                .ilike('title', `%${searchQuery}%`)
                .limit(5);

            if (!error && data) {
                setSearchResults(data);
            }
            setIsSearching(false);
        }, 500);

    }, [searchQuery, entryType, supabase]);

    // Initialize state from initialData
    useEffect(() => {
        if (initialData && isOpen) {
            setEntryType(initialData.entryType);
            setReviewText(initialData.reviewText || "");
            setStatus(initialData.status === 'DISCUSSION' ? 'READING' : initialData.status);

            if (initialData.entryType === 'BOOK_DB' && initialData.book) {
                setSelectedBook(initialData.book);
            } else if (initialData.entryType === 'BOOK_MANUAL' && initialData.manualData) {
                setManualTitle(initialData.manualData.title || "");
                setManualAuthor(initialData.manualData.author || "");
                setManualCoverUrl(initialData.manualData.coverUrl || "");
            } else if (initialData.entryType === 'TOPIC' && initialData.manualData) {
                setTopicTitle(initialData.manualData.topicTitle || "");
            }
        } else if (!initialData && isOpen) {
            // Reset form if no initialData
            setEntryType('BOOK_DB');
            setReviewText("");
            setStatus('READING');
            setRating(0);
            setSelectedBook(null);
            setManualTitle("");
            setManualAuthor("");
            setManualCoverUrl("");
            setTopicTitle("");
            setErrorMessage("");
        }
    }, [initialData, isOpen]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!reviewText.trim()) {
            setErrorMessage("Ulasan tidak boleh kosong.");
            return;
        }

        if (entryType === 'BOOK_DB' && !selectedBook) {
            setErrorMessage("Silakan pilih buku dari daftar pencarian.");
            return;
        }

        if (entryType === 'BOOK_MANUAL' && (!manualTitle.trim() || !manualAuthor.trim())) {
            setErrorMessage("Judul dan penulis buku wajib diisi.");
            return;
        }

        if (entryType === 'TOPIC' && !topicTitle.trim()) {
            setErrorMessage("Judul topik wajib diisi.");
            return;
        }

        if (entryType === 'BOOK_DB' && status === 'FINISHED' && rating === 0) {
            setErrorMessage("Rating wajib diisi jika selesai membaca.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");

        const manualData = entryType === 'BOOK_MANUAL' ? {
            title: manualTitle,
            author: manualAuthor,
            coverUrl: manualCoverUrl,
        } : entryType === 'TOPIC' ? {
            topicTitle: topicTitle,
        } : entryType === 'BOOK_DB' ? {
            rating: rating
        } : undefined;

        const payload = {
            eventId,
            userId,
            reviewText,
            entryType,
            status: entryType === 'TOPIC' ? 'DISCUSSION' : status,
            bookId: entryType === 'BOOK_DB' ? selectedBook!.id : null,
            manualData,
        };

        let error;

        if (initialData) {
            // UPDATE existing review
            const { error: updateError } = await supabase
                .from('SilentReadingReview')
                .update(payload)
                .eq('id', initialData.id);
            error = updateError;
        } else {
            // INSERT new review
            const { error: insertError } = await supabase.from('SilentReadingReview').insert(payload);
            error = insertError;
        }

        if (error) {
            setErrorMessage(error.message);
            setIsSubmitting(false);
        } else {
            // Auto-sync to General Review if applicable
            if (entryType === 'BOOK_DB' && status === 'FINISHED' && selectedBook) {
                try {
                    await fetch("/api/reviews", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            bookId: selectedBook.id,
                            rating: rating,
                            comment: reviewText,
                        }),
                    });
                    // We ignore errors here (e.g., duplicate review) to avoid blocking the user flow
                    // since the primary action (Event Review) succeeded.
                } catch (err) {
                    console.error("Failed to sync general review:", err);
                }
            }

            router.refresh();
            onSuccess();
        }
    };

    return (
        <BottomSheet isOpen={isOpen} onClose={onClose} title="Tulis Ulasan / Aktivitas">
            <div className="flex flex-col h-full bg-white">
                <div className="flex-1 overflow-y-auto px-1 scrollbar-hide">
                    {/* Entry Type Tabs */}
                    <div className="mb-6 flex gap-2 rounded-xl bg-slate-50 p-1">
                        {(['BOOK_DB', 'BOOK_MANUAL', 'TOPIC'] as EntryType[]).map((type) => (
                            <button
                                key={type}
                                onClick={() => { setEntryType(type); setSelectedBook(null); setErrorMessage(""); setSearchResults([]); }}
                                className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${entryType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                                    }`}
                            >
                                {type === 'BOOK_DB' ? 'Cari Buku' : type === 'BOOK_MANUAL' ? 'Input Buku' : 'Topik Diskusi'}
                            </button>
                        ))}
                    </div>

                    {/* Content per Type */}
                    <div className="space-y-4">
                        {entryType === 'BOOK_DB' && (
                            <div>
                                {!selectedBook ? (
                                    <div className="relative">
                                        <label className="mb-1 block text-sm font-semibold text-slate-700">Cari Buku</label>
                                        <input
                                            type="text"
                                            placeholder="Ketik judul buku..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                        />
                                        {isSearching && <div className="absolute right-4 top-10 text-xs text-slate-400">Mencari...</div>}
                                        {searchResults.length > 0 && (
                                            <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white shadow-lg z-10 relative">
                                                {searchResults.map(book => (
                                                    <button key={book.id} onClick={() => { setSelectedBook(book); setSearchQuery(""); setSearchResults([]) }} className="flex w-full items-center gap-3 p-3 text-left hover:bg-slate-50">
                                                        <div className="h-10 w-8 flex-shrink-0 bg-slate-200 overflow-hidden rounded relative">
                                                            {book.coverImageUrl && <Image src={book.coverImageUrl ?? ''} alt={book.title} fill className="object-cover" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800 text-sm line-clamp-1">{book.title}</p>
                                                            <p className="text-xs text-slate-500">{book.author}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                        <div className="h-16 w-12 flex-shrink-0 bg-slate-200 overflow-hidden rounded-md shadow-sm relative">
                                            {selectedBook.coverImageUrl && <Image src={selectedBook.coverImageUrl ?? ''} alt={selectedBook.title} fill className="object-cover" />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900">{selectedBook.title}</h3>
                                            <p className="text-sm text-slate-600">{selectedBook.author}</p>
                                        </div>
                                        <button onClick={() => setSelectedBook(null)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Ganti</button>
                                    </div>
                                )}
                            </div>
                        )}

                        {entryType === 'BOOK_MANUAL' && (
                            <>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Judul Buku</label>
                                    <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" value={manualTitle} onChange={e => setManualTitle(e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">Penulis</label>
                                    <input type="text" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" value={manualAuthor} onChange={e => setManualAuthor(e.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-slate-700">URL Sampul (Opsional)</label>
                                    <input type="text" placeholder="https://..." className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" value={manualCoverUrl} onChange={e => setManualCoverUrl(e.target.value)} />
                                </div>
                            </>
                        )}

                        {entryType === 'TOPIC' && (
                            <div>
                                <label className="mb-1 block text-sm font-semibold text-slate-700">Topik Diskusi</label>
                                <input type="text" placeholder="Apa yang sedang didiskusikan?" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none" value={topicTitle} onChange={e => setTopicTitle(e.target.value)} />
                            </div>
                        )}

                        {/* Status for Books */}
                        {entryType !== 'TOPIC' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-slate-700">Status Membaca</label>
                                    <div className="flex gap-3">
                                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700">
                                            <input type="radio" name="status" checked={status === 'READING'} onChange={() => setStatus('READING')} className="hidden" />
                                            <span className="text-sm font-medium">Sedang Membaca</span>
                                        </label>
                                        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 cursor-pointer has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700">
                                            <input type="radio" name="status" checked={status === 'FINISHED'} onChange={() => setStatus('FINISHED')} className="hidden" />
                                            <span className="text-sm font-medium">Selesai Membaca</span>
                                        </label>
                                    </div>
                                </div>

                                {entryType === 'BOOK_DB' && status === 'FINISHED' && (
                                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                                        <label className="mb-2 block text-sm font-semibold text-amber-900">
                                            Rating Buku
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                                            <span className="text-sm font-medium text-amber-700">
                                                {rating > 0 ? `${rating} dari 5` : "Beri rating"}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-amber-700/80">
                                            Ulasan ini juga akan ditambahkan ke halaman detail buku secara otomatis.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Review Text */}
                        <div>
                            <label className="mb-1 block text-sm font-semibold text-slate-700">Ulasan / Catatan</label>
                            <textarea
                                rows={4}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                                placeholder="Bagikan pemikiranmu..."
                                value={reviewText}
                                onChange={(e) => setReviewText(e.target.value)}
                            />
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600">
                            {errorMessage}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 pt-6 pb-2">
                    <button onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Mengirim...' : initialData ? 'Simpan Perubahan' : 'Kirim Ulasan'}
                    </button>
                </div>
            </div>
        </BottomSheet>
    );
}
