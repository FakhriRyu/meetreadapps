import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser || sessionUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const supabase = getSupabaseServer();

        // First get the banner to check if it exists (and maybe delete image from storage if we wanted to be thorough, but for now just DB)
        // Ideally we should delete the image from storage too, but the client might handle that or we can leave it orphan for now to keep it simple as per plan.
        // Actually, let's try to delete from storage if we can get the path from URL.
        // But the URL might be full public URL.
        // Let's just delete the record for now.

        const { error } = await supabase
            .from("Banner")
            .delete()
            .eq("id", parseInt(id));

        if (error) {
            console.error("Error deleting banner:", error);
            return NextResponse.json({ error: "Failed to delete banner" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser || sessionUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const supabase = getSupabaseServer();

        const { data, error } = await supabase
            .from("Banner")
            .update(body)
            .eq("id", parseInt(id))
            .select()
            .single();

        if (error) {
            console.error("Error updating banner:", error);
            return NextResponse.json({ error: "Failed to update banner" }, { status: 500 });
        }

        return NextResponse.json({ banner: data });
    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
