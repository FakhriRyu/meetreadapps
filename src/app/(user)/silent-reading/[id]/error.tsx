'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        // Log the error using the browser console for the user to see (as per the error message screenshot)
        console.error("Event Detail Page Error:", error);
    }, [error]);

    const handleLoginUlang = async () => {
        setIsLoggingOut(true);
        try {
            const supabase = createSupabaseClient();
            await supabase.auth.signOut();
            window.location.href = '/login'; // Hard navigation to ensure clear state
        } catch (e) {
            console.error("Logout failed", e);
            window.location.href = '/login';
        }
    };

    return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" x2="12" y1="8" y2="12" />
                        <line x1="12" x2="12.01" y1="16" y2="16" />
                    </svg>
                </div>
                <h2 className="mb-3 text-2xl font-bold text-slate-900">
                    Terjadi Kesalahan
                </h2>
                <p className="mb-8 text-slate-600 leading-relaxed">
                    Mohon maaf, terjadi kendala saat memuat halaman ini. Silakan hubungi developer jika masalah berlanjut.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => reset()}
                        className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-indigo-300"
                    >
                        Coba Lagi
                    </button>

                    <button
                        onClick={handleLoginUlang}
                        disabled={isLoggingOut}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-70"
                    >
                        {isLoggingOut ? 'Sedang Keluar...' : 'Login Ulang'}
                    </button>
                </div>

                {/* Debugging Info requested by user */}
                <div className="mt-6 w-full rounded-xl bg-slate-50 p-4 text-left">
                    <p className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Detail Error:</p>
                    <code className="block w-full overflow-x-auto whitespace-pre-wrap text-sm text-rose-600 font-mono">
                        {error.message || "Unknown error occurred"}
                    </code>
                    {error.digest && (
                        <p className="mt-2 text-xs text-slate-400 font-mono">
                            Digest: {error.digest}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
