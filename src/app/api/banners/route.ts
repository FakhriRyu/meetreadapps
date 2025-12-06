import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = getSupabaseServer();

        const { data, error } = await supabase
            .from("Banner")
            .select("*")
            .eq("isActive", true)
            .order("order", { ascending: true })
            .order("createdAt", { ascending: false });

        if (error) {
            console.error("Error fetching banners:", error);
            return NextResponse.json({ error: "Failed to fetch banners" }, { status: 500 });
        }

        return NextResponse.json({ banners: data });
    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
