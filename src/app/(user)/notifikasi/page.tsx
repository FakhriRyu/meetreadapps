"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

type Notification = {
    id: number;
    type: "APPROVED" | "REJECTED" | "CANCELLED" | "EXTENDED" | "RETURNED";
    message: string | null;
    createdAt: string;
    isRead: boolean;
    request: {
        id: number;
        book: {
            title: string;
            coverImageUrl: string | null;
        };
    };
};

export default function NotifikasiPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch("/api/notifications");
                const result = await response.json();
                if (response.ok) {
                    setNotifications(result.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch notifications", error);
            } finally {
                setLoading(false);
            }
        };

        const markAsRead = async () => {
            try {
                await fetch("/api/notifications", { method: "PATCH" });
            } catch (error) {
                console.error("Failed to mark notifications as read", error);
            }
        };

        fetchNotifications();
        markAsRead();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f5f7ff] px-6 pt-10 pb-24">
                <header className="mb-8 flex items-center gap-4">
                    <Link href="/beranda" className="rounded-full bg-white p-2 shadow-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5m7 7-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900">Notifikasi</h1>
                </header>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 animate-pulse rounded-3xl bg-slate-200" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f5f7ff] px-6 pt-10 pb-24 text-slate-900">
            <header className="mb-8 flex items-center gap-4">
                <Link href="/beranda" className="rounded-full bg-white p-2 shadow-sm transition hover:bg-slate-50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5m7 7-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
                <h1 className="text-xl font-bold text-slate-900">Notifikasi</h1>
            </header>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="mb-4 rounded-full bg-slate-100 p-4">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M18 16v-5a6 6 0 0 0-12 0v5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M5 16h14l-1.5 2.5a1 1 0 0 1-.86.5H7.36a1 1 0 0 1-.86-.5L5 16Z" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M10 20a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-900">Belum ada notifikasi</p>
                        <p className="text-xs text-slate-500">Aktivitas peminjamanmu akan muncul di sini.</p>
                    </div>
                ) : (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`relative overflow-hidden rounded-3xl border p-4 transition ${notif.isRead ? "border-slate-200 bg-white" : "border-indigo-100 bg-indigo-50/50"
                                }`}
                        >
                            <div className="flex gap-4">
                                <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                                    {notif.request.book.coverImageUrl ? (
                                        <Image
                                            src={notif.request.book.coverImageUrl}
                                            alt={notif.request.book.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                                            Cover
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                                            {notif.request.book.title}
                                        </h3>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                                        </span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-700">
                                        {getNotificationTitle(notif.type)}
                                    </p>
                                    {notif.message && (
                                        <p className="text-xs text-slate-500 line-clamp-2">"{notif.message}"</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function getNotificationTitle(type: Notification["type"]) {
    switch (type) {
        case "APPROVED":
            return "Permintaan peminjaman disetujui! 🎉";
        case "REJECTED":
            return "Permintaan peminjaman ditolak.";
        case "CANCELLED":
            return "Permintaan dibatalkan.";
        case "EXTENDED":
            return "Masa peminjaman diperpanjang.";
        case "RETURNED":
            return "Buku telah dikembalikan. Terima kasih! 📚";
        default:
            return "Ada pembaruan pada permintaanmu.";
    }
}
