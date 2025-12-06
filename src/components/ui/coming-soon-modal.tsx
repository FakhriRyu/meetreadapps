"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";

interface ComingSoonModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
    const [timeLeft, setTimeLeft] = useState(3);

    useEffect(() => {
        if (!isOpen) {
            setTimeLeft(3); // Reset timer when closed/re-opened
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onClose(); // Auto close
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOpen, onClose]);

    // Handle immediate close properly by clearing any potential timeouts if component unmounts
    // but simpler logic is just relying on the useEffect cleanup.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 p-6 flex flex-col items-center text-center">
                {/* Close Button extended area */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                    <X className="w-5 h-5 text-slate-400" />
                </button>

                <div className="relative w-48 h-48 mb-4">
                    <Image
                        src="/cute-cat-popup.png"
                        alt="Coming Soon Cat"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>

                <h3 className="text-xl font-bold text-slate-900 mb-2">
                    Coming Soon!
                </h3>

                <p className="text-slate-500 text-sm mb-6 max-w-[200px]">
                    Fitur ini sedang kami siapkan untukmu. Tunggu ya!
                    <br />
                    <span className="text-xs text-slate-400 mt-2 block">
                        Menutup otomatis dalam {timeLeft}d...
                    </span>
                </p>

                <button
                    onClick={onClose}
                    className="w-full rounded-2xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
                >
                    OK, Siap Menunggu!
                </button>
            </div>
        </div>
    );
}
