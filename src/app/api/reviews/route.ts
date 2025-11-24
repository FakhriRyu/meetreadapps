import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session-supabase";
import { z } from "zod";

const ReviewSchema = z.object({
    bookId: z.number(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(3, "Komentar minimal 3 karakter"),
});

export async function POST(request: NextRequest) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await request.json();
        const payload = ReviewSchema.parse(json);

        const supabase = getSupabaseServer();

        // Check if user already reviewed this book
        const { data: existingReview } = await supabase
            .from("Review")
            .select("id")
            .eq("bookId", payload.bookId)
            .eq("userId", sessionUser.id)
            .single();

        if (existingReview) {
            return NextResponse.json(
                { error: "Kamu sudah memberikan review untuk buku ini." },
                { status: 409 }
            );
        }

        const { data, error } = await supabase
            .from("Review")
            .insert({
                bookId: payload.bookId,
                userId: sessionUser.id,
                rating: payload.rating,
                comment: payload.comment,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating review:", error);
            return NextResponse.json({ error: "Gagal menyimpan review." }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const bookId = searchParams.get("bookId");

    if (!bookId) {
        return NextResponse.json({ error: "Missing bookId" }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { data: reviews, error } = await supabase
        .from("Review")
        .select(`
      id,
      rating,
      comment,
      createdAt,
      user:User(id, name, profileImage)
    `)
        .eq("bookId", Number(bookId))
        .order("createdAt", { ascending: false });

    if (error) {
        console.error("Error fetching reviews:", error);
        return NextResponse.json({ error: "Gagal mengambil review." }, { status: 500 });
    }

    return NextResponse.json({ data: reviews });
}

export async function PUT(request: NextRequest) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const json = await request.json();
        const payload = z.object({
            id: z.number(),
            rating: z.number().min(1).max(5),
            comment: z.string().min(3, "Komentar minimal 3 karakter"),
        }).parse(json);

        const supabase = getSupabaseServer();

        // Verify ownership
        const { data: existingReview } = await supabase
            .from("Review")
            .select("userId")
            .eq("id", payload.id)
            .single();

        if (!existingReview) {
            return NextResponse.json({ error: "Review tidak ditemukan." }, { status: 404 });
        }

        if (existingReview.userId !== sessionUser.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { data, error } = await supabase
            .from("Review")
            .update({
                rating: payload.rating,
                comment: payload.comment,
            })
            .eq("id", payload.id)
            .select()
            .single();

        if (error) {
            console.error("Error updating review:", error);
            return NextResponse.json({ error: "Gagal memperbarui review." }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser || sessionUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const reviewId = searchParams.get("id");

        if (!reviewId) {
            return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
        }

        const supabase = getSupabaseServer();

        const { error } = await supabase
            .from("Review")
            .delete()
            .eq("id", reviewId);

        if (error) {
            console.error("Error deleting review:", error);
            return NextResponse.json({ error: "Gagal menghapus review." }, { status: 500 });
        }

        return NextResponse.json({ message: "Review berhasil dihapus." });
    } catch (error) {
        console.error("Error in DELETE review:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
