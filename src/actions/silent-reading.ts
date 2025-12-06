'use server';

import { getSessionUser } from "@/lib/session-supabase";
import { getSupabaseServer } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function joinSilentReadingEvent(eventId: number) {
    try {
        const sessionUser = await getSessionUser();

        if (!sessionUser) {
            return { error: "Silakan login terlebih dahulu untuk bergabung." };
        }

        const supabase = getSupabaseServer();

        // Check if already joined (optional, but good for UX/Data integrity if not relying solely on unique constraint)
        const { data: existing } = await supabase
            .from("SilentReadingParticipant")
            .select("id")
            .eq("event_id", eventId)
            .eq("user_id", sessionUser.id)
            .single();

        if (existing) {
            return { message: "Sudah bergabung." };
        }

        const { error } = await supabase.from("SilentReadingParticipant").insert({
            event_id: eventId,
            user_id: sessionUser.id,
        });

        if (error) {
            console.error("Error in joinSilentReadingEvent:", JSON.stringify(error, null, 2));
            return { error: "Gagal bergabung ke acara. Silakan coba lagi." };
        }

        revalidatePath('/silent-reading');
        return { success: true };

    } catch (err) {
        console.error("Unexpected error in joinSilentReadingEvent:", err);
        return { error: "Terjadi kesalahan sistem." };
    }
}

export async function upsertSilentReadingEvent(data: {
    id?: number | null;
    title: string;
    description: string | null;
    startDate: string;
    coverImageUrl: string | null;
    isActive?: boolean;
}) {
    try {
        const sessionUser = await getSessionUser();

        // TODO: Strict Admin Check. For now checking if user exists, assuming admin panel is protected or we trust the session.
        // Ideally: if (sessionUser?.role !== 'ADMIN') return { error: "Unauthorized" };
        if (!sessionUser) {
            return { error: "Unauthorized" };
        }

        const supabase = getSupabaseServer();

        if (data.id) {
            // Update
            const { data: updatedEvent, error } = await supabase
                .from("SilentReadingEvent")
                .update({
                    title: data.title,
                    description: data.description,
                    startDate: data.startDate,
                    coverImageUrl: data.coverImageUrl,
                    isActive: data.isActive
                })
                .eq('id', data.id)
                .select()
                .single();

            if (error) {
                console.error("Error updating event:", JSON.stringify(error, null, 2));
                return { error: error.message };
            }
            revalidatePath('/silent-reading');
            revalidatePath(`/silent-reading/${data.id}`);
            return { success: true, data: updatedEvent };
        } else {
            // Insert
            const { data: newEvent, error } = await supabase
                .from("SilentReadingEvent")
                .insert({
                    title: data.title,
                    description: data.description,
                    startDate: data.startDate,
                    coverImageUrl: data.coverImageUrl,
                    isActive: data.isActive !== undefined ? data.isActive : true
                })
                .select()
                .single();

            if (error) {
                console.error("Error creating event:", JSON.stringify(error, null, 2));
                return { error: error.message };
            }
            revalidatePath('/silent-reading');
            return { success: true, data: newEvent };
        }

    } catch (error) {
        console.error("Unexpected error in upsertSilentReadingEvent:", error);
        return { error: "Internal Server Error" };
    }
}

export async function toggleSilentReadingEvent(id: number, isActive: boolean) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) return { error: "Unauthorized" };

        const supabase = getSupabaseServer();
        const { error } = await supabase
            .from("SilentReadingEvent")
            .update({ isActive })
            .eq("id", id);

        if (error) {
            console.error("Error toggling event:", JSON.stringify(error, null, 2));
            return { error: error.message };
        }

        revalidatePath('/silent-reading');
        revalidatePath(`/silent-reading/${id}`);
        return { success: true };

    } catch (error) {
        console.error("Unexpected error in toggleSilentReadingEvent:", error);
        return { error: "Internal Server Error" };
    }
}
