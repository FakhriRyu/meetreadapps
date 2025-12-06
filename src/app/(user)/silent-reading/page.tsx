import { Suspense } from "react";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";

export const revalidate = 30;

export const metadata = {
    title: "Silent Reading - MeetRead",
    description: "Ikuti kegiatan Silent Reading mingguan kami",
};

import { EventListItem } from "@/components/silent-reading/event-list-item";

async function EventList() {
    const sessionUser = await getSessionUser();
    const supabase = getSupabaseServer();
    // Fetch all events (active and closed), ordered by start date descending
    const { data: events, error } = await supabase
        .from('SilentReadingEvent')
        .select('*')
        .order('startDate', { ascending: false });

    if (error) {
        console.error('Error fetching silent reading events:', JSON.stringify(error, null, 2));
        return <div className="p-8 text-center text-red-500">Gagal memuat jadwal.</div>;
    }

    const participatedEventIds = new Set<number>();
    if (sessionUser) {
        const { data: participations } = await supabase
            .from('SilentReadingParticipant')
            .select('event_id')
            .eq('user_id', sessionUser.id);

        if (participations) {
            participations.forEach(p => participatedEventIds.add(p.event_id));
        }
    }

    return (
        <div className="flex flex-col gap-4">
            {events?.map((event) => (
                <EventListItem
                    key={event.id}
                    event={event}
                    isJoined={participatedEventIds.has(event.id)}
                    userId={sessionUser?.id}
                />
            ))}
            {(!events || events.length === 0) && (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-4 py-12 text-center shadow-sm border border-slate-200">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-slate-400">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Belum Ada Jadwal</h3>
                    <p className="mt-2 max-w-xs text-sm text-slate-500">
                        Saat ini belum ada jadwal Silent Reading yang aktif. Tunggu informasi selanjutnya ya!
                    </p>
                </div>
            )}
        </div>
    );
}

export default function SilentReadingPage() {
    return (
        <div className="min-h-screen bg-[#f5f7ff] pb-24 text-slate-900">
            <main className="mx-auto flex w-full max-w-xl flex-col px-6 pt-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Silent Reading</h1>
                    <p className="mt-2 text-slate-500">
                        Temukan teman membaca dan bagikan inspirasi dari buku yang kamu baca.
                    </p>
                </header>

                <Suspense fallback={
                    <div className="flex flex-col gap-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-200"></div>
                        ))}
                    </div>
                }>
                    <EventList />
                </Suspense>
            </main>
        </div>
    );
}
