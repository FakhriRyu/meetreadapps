import { getSupabaseServer } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const supabase = getSupabaseServer();

        // Get distinct categories from books table
        const { data, error } = await supabase
            .from("Book")
            .select("category")
            .not("category", "is", null)
            .order("category");

        if (error) {
            console.error("Error fetching categories:", error);
            return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
        }

        // Extract unique categories and filter out empty strings
        const uniqueCategories = Array.from(
            new Set(
                data
                    .map((book: { category: string | null }) => book.category?.trim())
                    .filter((category: string | null | undefined): category is string => Boolean(category))
            )
        ).sort();

        return NextResponse.json({ data: uniqueCategories });
    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
