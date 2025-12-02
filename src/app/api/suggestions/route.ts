import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-supabase";
import { supabaseServer } from "@/lib/supabase";

export async function POST(request: Request) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json(
                { error: "Anda harus masuk untuk memberikan saran." },
                { status: 401 }
            );
        }

        const { suggestion } = await request.json();

        if (!suggestion || typeof suggestion !== "string" || suggestion.trim().length === 0) {
            return NextResponse.json(
                { error: "Saran tidak boleh kosong." },
                { status: 400 }
            );
        }

        const { error } = await supabaseServer.from("AppSuggestion").insert({
            userId: sessionUser.id,
            suggestion: suggestion.trim(),
        });

        if (error) {
            console.error("Error saving suggestion:", error);
            return NextResponse.json(
                { error: "Gagal menyimpan saran. Silakan coba lagi." },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Unexpected error in suggestion API:", error);
        return NextResponse.json(
            { error: "Terjadi kesalahan internal." },
            { status: 500 }
        );
    }
}
