
"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { joinSilentReadingEvent } from "@/actions/silent-reading";

type EventListItemProps = {
    event: {
        id: number;
        title: string;
        description: string | null;
        startDate: string;
        coverImageUrl: string | null;
    };
    isJoined: boolean;
    userId: number | undefined;
};

export function EventListItem({ event, isJoined: initialIsJoined, userId }: EventListItemProps) {
    const [isJoined, setIsJoined] = useState(initialIsJoined);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!userId) {
            alert("Silakan login terlebih dahulu.");
            return;
        }

        setIsLoading(true);
        setIsLoading(true);
        const result = await joinSilentReadingEvent(event.id);

        if (result.error) {
            console.error("Error joining event:", result.error);
            alert(result.error);
            setIsLoading(false);
        } else {
            setIsJoined(true);
            setIsLoading(false);
            // Router refresh handled by revalidatePath in server action, but calling here helps update client state if needed
            // although setIsJoined local state is immediate feedback.
            router.refresh();
        }
    };

    const CardContent = (
        <>
            {/* Cover Image inside card */}
            <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-slate-100">
                {event.coverImageUrl ? (
                    <img
                        src={event.coverImageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12">
                            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                        </svg>
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <span className="inline-block rounded-full bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm">
                        Topik Minggu Ini
                    </span>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {event.title}
                </h2>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                        <line x1="16" x2="16" y1="2" y2="6" />
                        <line x1="8" x2="8" y1="2" y2="6" />
                        <line x1="3" x2="21" y1="10" y2="10" />
                    </svg>
                    <span>
                        {(() => {
                            try {
                                return format(new Date(event.startDate), 'EEEE, d MMMM yyyy', { locale: id });
                            } catch {
                                return '-';
                            }
                        })()}
                    </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 line-clamp-2">
                    {event.description}
                </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
                {isJoined ? (
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                        <span>Lihat detail & review</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform group-hover:translate-x-1">
                            <path d="M5 12h14" />
                            <path d="m12 5 7 7-7 7" />
                        </svg>
                    </div>
                ) : (
                    <button
                        onClick={handleJoin}
                        disabled={isLoading}
                        className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-70 disabled:cursor-not-allowed group-hover:shadow-indigo-200"
                    >
                        {isLoading ? "Bergabung..." : "Gabung Kegiatan"}
                    </button>
                )}
            </div>
        </>
    );

    if (isJoined) {
        return (
            <Link
                href={`/silent-reading/${event.id}`}
                className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50"
            >
                {CardContent}
            </Link>
        );
    }

    return (
        <div className="group relative block overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50">
            {CardContent}
        </div>
    );
}
