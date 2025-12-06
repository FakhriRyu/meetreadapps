
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase";

type JoinButtonProps = {
    eventId: number;
    userId: number;
    onSuccess?: () => void;
};

export function JoinButton({ eventId, userId, onSuccess }: JoinButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const supabase = createSupabaseClient();

    const handleJoin = async () => {
        setIsLoading(true);
        const { error } = await supabase.from("SilentReadingParticipant").insert({
            event_id: eventId,
            user_id: userId,
        });

        if (error) {
            console.error("Error joining event:", error);
            alert("Gagal bergabung ke acara.");
            setIsLoading(false);
        } else {
            setIsLoading(false);
            router.refresh();
            if (onSuccess) onSuccess();
        }
    };

    return (
        <button
            onClick={handleJoin}
            disabled={isLoading}
            className="inline-flex items-center rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700 hover:shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
            {isLoading ? "Bergabung..." : "Gabung Kegiatan Ini"}
        </button>
    );
}
