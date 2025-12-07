"use client";

import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { SafeImage } from "@/components/ui/safe-image";

interface SilentReadingReviewCardProps {
    review: any;
    index: number;
}

// Helper to convert URL to Base64
function useImageToBase64(url: string | null | undefined) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!url) {
            setDataUrl(null);
            return;
        }

        // If it's already a data URL or local path (starts with /), just use it (assuming local paths are safe-ish, or better yet, fetch them too if needed)
        // For Supabase/external URLs, we fetch.
        // Actually, fetch works for local too usually.
        let isMounted = true;

        const fetchImage = async () => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (isMounted) setDataUrl(reader.result as string);
                };
                reader.readAsDataURL(blob);
            } catch (error) {
                console.error("Error converting image to base64:", error);
                // Fallback to original URL if fetch fails, though it might still fail CORS in canvas
                if (isMounted) setDataUrl(url);
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
        };
    }, [url]);

    return dataUrl;
}

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
    const captureRef = useRef<HTMLDivElement>(null); // Dedicated Ref for capture
    const [isGenerating, setIsGenerating] = useState(false);

    // Use Hex codes to avoid 'oklch' errors in html2canvas (Tailwind 4 defaults to oklch)
    const STICKY_STYLES = [
        { bg: '#fef9c3', text: '#713f12' }, // yellow-100 / yellow-900
        { bg: '#ffe4e6', text: '#881337' }, // rose-100 / rose-900
        { bg: '#dbeafe', text: '#1e3a8a' }, // blue-100 / blue-900
        { bg: '#dcfce7', text: '#14532d' }, // green-100 / green-900
        { bg: '#f3e8ff', text: '#581c87' }, // purple-100 / purple-900
        { bg: '#ffedd5', text: '#7c2d12' }, // orange-100 / orange-900
    ];

    const STICKY_ROTATIONS = [
        'rotate-1',
        '-rotate-1',
        'rotate-2',
        '-rotate-2',
        'rotate-3',
        '-rotate-3',
    ];

    const style = STICKY_STYLES[index % STICKY_STYLES.length];
    const rotationClass = STICKY_ROTATIONS[index % STICKY_ROTATIONS.length];

    // Extract content details
    let title = '';
    let subtitle = '';
    let coverUrlOriginal = '';
    let isBook = false;

    if (review.entryType === 'BOOK_DB' && (review.book as any)) {
        title = (review.book as any).title;
        subtitle = (review.book as any).author;
        coverUrlOriginal = (review.book as any).coverImageUrl;
        isBook = true;
    } else if (review.entryType === 'BOOK_MANUAL' && (review.manualData as any)) {
        title = (review.manualData as any).title || 'Judul Buku';
        subtitle = (review.manualData as any).author || 'Penulis';
        coverUrlOriginal = (review.manualData as any).coverUrl;
        isBook = true;
    } else if (review.entryType === 'TOPIC') {
        title = (review.manualData as any)?.topicTitle || 'Topik Diskusi';
        subtitle = 'Diskusi Grup';
        isBook = false;
    }

    const userProfileUrlOriginal = (review.user as any)?.profileImage;

    // Convert images to Base64
    const coverUrl = useImageToBase64(coverUrlOriginal);
    const userProfileUrl = useImageToBase64(userProfileUrlOriginal);

    // We use the base64 url if available, otherwise original (though original might fail CORS in canvas)
    // If base64 is still loading, it might be null, but safe-image handles null src by showing nothing or fallback?
    // SafeImage expects src string.
    const finalCoverUrl = coverUrl || coverUrlOriginal || '';
    const finalProfileUrl = userProfileUrl || userProfileUrlOriginal || '';

    const [showCaptureTemplate, setShowCaptureTemplate] = useState(false);

    // Effect to trigger capture once the template is rendered
    useEffect(() => {
        if (showCaptureTemplate) {
            const capture = async () => {
                try {
                    // Slight delay to ensure rendering and image painting
                    await new Promise(resolve => setTimeout(resolve, 500));

                    const element = captureRef.current;
                    if (!element) throw new Error("Capture element not found");

                    const canvas = await html2canvas(element, {
                        scale: 2, // Retain high quality
                        useCORS: true,
                        backgroundColor: null,
                        logging: false,
                    });

                    const image = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = image;
                    link.download = `review-${review.id}-${title.slice(0, 10)}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                } catch (error) {
                    console.error("Error generating image:", error);
                    alert(`Gagal membuat gambar: ${error instanceof Error ? error.message : 'Unknown error'}`);
                } finally {
                    setShowCaptureTemplate(false);
                    setIsGenerating(false);
                }
            };
            capture();
        }
    }, [showCaptureTemplate]);

    const handleShare = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setShowCaptureTemplate(true);
    };

    return (
        <>
            {/* Visible Card (Responsive, Interactive) */}
            <div
                ref={cardRef}
                className={`group relative flex flex-col p-6 transition-all hover:scale-105 hover:z-10 ${rotationClass}`}
                style={{
                    aspectRatio: '1/1',
                    backgroundColor: style.bg,
                    color: style.text,
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
            >
                {/* ... existing visible card content ... */}
                {/* Share Button moved to bottom-right */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleShare();
                    }}
                    disabled={isGenerating}
                    className="absolute bottom-2 right-2 p-1.5 rounded-full hover:opacity-100 transition-opacity z-30 opacity-60"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.05)',
                        color: 'currentColor',
                    }}
                    title="Simpan sebagai gambar"
                >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                </button>


                {/* Tape Effect */}
                <div
                    className="absolute -top-3 left-1/2 h-8 w-24 -translate-x-1/2 rotate-1 backdrop-blur-sm transform z-20"
                    style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                ></div>

                {/* Header with rating */}
                <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold" style={{ opacity: 0.7 }}>
                        {safeFormatDate(review.createdAt, 'd MMM')}
                        {review.status === 'FINISHED' && (review.manualData as any)?.rating > 0 && (
                            <span className="flex items-center">
                                ★ {(review.manualData as any)?.rating}
                            </span>
                        )}
                    </div>
                    <div
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border"
                        style={{
                            borderColor: 'currentColor',
                            opacity: 0.8
                        }}
                    >
                        {review.status === 'READING' ? 'Reading' : review.status === 'FINISHED' ? 'Done' : 'Discuss'}
                    </div>
                </div>

                {/* Review Content */}
                <div className="flex-1 overflow-hidden font-medium leading-relaxed relative mb-4" style={{ opacity: 0.9 }}>
                    <p className="line-clamp-6 text-sm sm:text-base">
                        "{review.reviewText}"
                    </p>
                </div>

                {/* Footer: Book Info & User */}
                <div className="mt-auto flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                    {/* Tiny Cover / Icon */}
                    <div className="h-10 w-8 flex-shrink-0 overflow-hidden rounded shadow-sm" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                        {isBook ? (
                            <SafeImage
                                src={finalCoverUrl || '/placeholder.png'}
                                alt={title}
                                width={32}
                                height={40}
                                className="h-full w-full object-cover"
                                fallbackContent={<div className="h-full w-full" style={{ backgroundColor: '#e2e8f0' }} />}
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-current" style={{ opacity: 0.5 }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold leading-tight">{title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="h-4 w-4 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
                                <SafeImage
                                    src={finalProfileUrl || '/placeholder.png'}
                                    alt={(review.user as any)?.name || 'User'}
                                    width={16}
                                    height={16}
                                    className="h-full w-full object-cover"
                                    fallbackContent={<div className="h-full w-full" style={{ backgroundColor: '#cbd5e1' }} />}
                                />
                            </div>
                            <p className="truncate text-[10px] font-medium" style={{ opacity: 0.7 }}>
                                {(review.user as any)?.name}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Capture Template (Rendered Only When Sharing) */}
            {showCaptureTemplate && (
                <div
                    ref={captureRef}
                    style={{
                        position: 'fixed',
                        left: '-9999px', // Off-screen
                        top: 0,
                        width: '1080px', // Increased canvas size for padding
                        height: '1080px',
                        padding: '140px', // Huge padding to allow tape and rotation without clipping
                        backgroundColor: 'transparent', // Transparent background for PNG
                        color: '#000000', // Explicitly set color to prevent inheriting 'oklch' from body
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: -50,
                    }}
                >
                    {/* The Actual Sticky Note */}
                    <div
                        style={{
                            width: '800px',
                            height: '800px',
                            backgroundColor: style.bg,
                            color: style.text,
                            fontFamily: 'sans-serif',
                            display: 'flex',
                            flexDirection: 'column',
                            padding: '60px',
                            position: 'relative',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', // Stronger shadow
                            transform: 'rotate(-1deg)', // Slight consistent rotation
                        }}
                    >
                        {/* Tape Effect - Now explicitly positioned to extend OUTSIDE the sticky note */}
                        <div
                            style={{
                                position: 'absolute',
                                top: '-25px', // Moves up outside the yellow paper
                                left: '50%',
                                transform: 'translateX(-50%) rotate(2deg)',
                                width: '240px',
                                height: '60px',
                                backgroundColor: 'rgba(255, 255, 255, 0.45)',
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                        ></div>

                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                            <div style={{ fontSize: '24px', fontWeight: '600', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {safeFormatDate(review.createdAt, 'd MMM yyyy')}
                                {review.status === 'FINISHED' && (review.manualData as any)?.rating > 0 && (
                                    <span>★ {(review.manualData as any)?.rating}</span>
                                )}
                            </div>
                            <div style={{
                                padding: '8px 24px',
                                borderRadius: '999px',
                                border: '3px solid currentColor',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                opacity: 0.8
                            }}>
                                {review.status === 'READING' ? 'Reading' : review.status === 'FINISHED' ? 'Done' : 'Discuss'}
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', marginBottom: '20px' }}>
                            <p style={{
                                fontSize: '32px',
                                lineHeight: '1.5',
                                fontWeight: '500',
                                opacity: 0.9,
                                whiteSpace: 'pre-wrap'
                            }}>
                                "{review.reviewText}"
                            </p>
                        </div>

                        {/* Footer */}
                        <div style={{
                            marginTop: 'auto',
                            paddingTop: '40px',
                            borderTop: '2px solid rgba(0,0,0,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px'
                        }}>
                            {/* Book Cover */}
                            <div style={{
                                width: '100px',
                                height: '140px',
                                flexShrink: 0,
                                borderRadius: '8px',
                                overflow: 'hidden',
                                backgroundColor: 'rgba(0,0,0,0.05)',
                                position: 'relative',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}>
                                {finalCoverUrl ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={finalCoverUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover" />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', opacity: 0.5 }}>📖</div>
                                )}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px', lineHeight: '1.2' }}>{title}</p>
                                <p style={{ fontSize: '24px', opacity: 0.7, marginBottom: '16px' }}>{subtitle}</p>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.5)', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)' }}>
                                        {finalProfileUrl ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={finalProfileUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="User" />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', backgroundColor: '#cbd5e1' }}></div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '24px', fontWeight: '600', opacity: 0.8 }}>
                                        {(review.user as any)?.name}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Branding/Watermark */}
                        <div style={{
                            position: 'absolute',
                            bottom: '24px',
                            right: '32px',
                            fontSize: '18px',
                            opacity: 0.5,
                            fontWeight: '600'
                        }}>
                            meetread.app
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
