"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import { Download, Loader2, Share2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { SafeImage } from "@/components/ui/safe-image";

interface SilentReadingReviewCardProps {
    review: any; // Using any to match existing flexibility, ideally type this properly
    index: number;
}

// Extract safe format date logic to reuse here
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

export function SilentReadingReviewCard({ review, index }: SilentReadingReviewCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Sticky Note Constants
    const STICKY_COLORS = [
        'bg-yellow-100 text-yellow-900',
        'bg-rose-100 text-rose-900',
        'bg-blue-100 text-blue-900',
        'bg-green-100 text-green-900',
        'bg-purple-100 text-purple-900',
        'bg-orange-100 text-orange-900',
    ];
    const STICKY_ROTATIONS = [
        'rotate-1',
        '-rotate-1',
        'rotate-2',
        '-rotate-2',
        'rotate-3',
        '-rotate-3',
    ];

    const colorClass = STICKY_COLORS[index % STICKY_COLORS.length];
    const rotationClass = STICKY_ROTATIONS[index % STICKY_ROTATIONS.length];

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

    const handleShare = async () => {
        if (!cardRef.current || isGenerating) return;

        try {
            setIsGenerating(true);

            // Create canvas from the card
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // Higher resolution
                useCORS: true, // Allow cross-origin images
                backgroundColor: null, // Transparent background if possible, though card has color
                logging: false,
            });

            // Convert to data URL
            const image = canvas.toDataURL("image/png");

            // Create download link
            const link = document.createElement("a");
            link.href = image;
            link.download = `review-${review.id}-${title.slice(0, 10)}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Optional: Web Share API if supported and needed in future
            // if (navigator.share) { ... }

        } catch (error) {
            console.error("Error generating image:", error);
            alert("Gagal membuat gambar. Silakan coba lagi.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div
            ref={cardRef}
            className={`group relative flex flex-col p-6 shadow-md transition-all hover:scale-105 hover:z-10 ${colorClass} ${rotationClass}`}
            style={{ aspectRatio: '1/1' }}
        >
            {/* Share Button (Hidden during capture if desired, or keep it?) 
                Let's keep it generally but maybe hide it for the screenshot if we want clean output.
                html2canvas has an 'ignoreElements' option, but simplest is to just have it there or use a data-html2canvas-ignore attribute.
            */}
            <button
                data-html2canvas-ignore
                onClick={(e) => {
                    e.stopPropagation();
                    handleShare();
                }}
                disabled={isGenerating}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/5 hover:bg-black/10 text-current opacity-0 group-hover:opacity-100 transition-opacity z-30"
                title="Simpan sebagai gambar"
            >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </button>


            {/* Tape Effect */}
            <div className="absolute -top-3 left-1/2 h-8 w-24 -translate-x-1/2 rotate-1 bg-white/40 shadow-sm backdrop-blur-sm transform z-20"></div>

            {/* Header with rating */}
            <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold opacity-70">
                    {safeFormatDate(review.createdAt, 'd MMM')}
                    {review.status === 'FINISHED' && (review.manualData as any)?.rating > 0 && (
                        <span className="flex items-center">
                            ★ {(review.manualData as any)?.rating}
                        </span>
                    )}
                </div>
                <div className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-current text-opacity-80`}>
                    {review.status === 'READING' ? 'Reading' : review.status === 'FINISHED' ? 'Done' : 'Discuss'}
                </div>
            </div>

            {/* Review Content */}
            <div className="flex-1 overflow-hidden font-medium leading-relaxed opacity-90 relative mb-4">
                <p className="line-clamp-6 text-sm sm:text-base">
                    "{review.reviewText}"
                </p>
            </div>

            {/* Footer: Book Info & User */}
            <div className="mt-auto flex items-center gap-3 pt-3 border-t border-black/10">
                {/* Tiny Cover / Icon */}
                <div className="h-10 w-8 flex-shrink-0 overflow-hidden rounded bg-black/10 shadow-sm">
                    {isBook ? (
                        <SafeImage
                            src={coverUrl || '/placeholder.png'}
                            alt={title}
                            width={32}
                            height={40}
                            className="h-full w-full object-cover"
                            fallbackContent={<div className="h-full w-full bg-slate-200" />}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-current opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold leading-tight">{title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="h-4 w-4 rounded-full overflow-hidden bg-white/50">
                            <SafeImage
                                src={(review.user as any)?.profileImage || ''}
                                alt={(review.user as any)?.name || 'User'}
                                width={16}
                                height={16}
                                className="h-full w-full object-cover"
                                fallbackContent={<div className="h-full w-full bg-slate-300" />}
                            />
                        </div>
                        <p className="truncate text-[10px] font-medium opacity-70">
                            {(review.user as any)?.name}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
