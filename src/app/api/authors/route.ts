import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function GET() {
    try {
        const { data, error } = await getSupabaseServer()
            .from("Book")
            .select("author");

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Extract unique authors and filter out null/empty values
        const authors = Array.from(new Set(data.map((item) => item.author)))
            .filter((author): author is string => Boolean(author));

        return NextResponse.json({ data: authors });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
