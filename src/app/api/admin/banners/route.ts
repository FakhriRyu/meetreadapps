import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser || sessionUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const supabase = getSupabaseServer();

        const { data, error } = await supabase
            .from("Banner")
            .select("*")
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

export async function POST(request: Request) {
    try {
        const sessionUser = await getSessionUser();
        if (!sessionUser || sessionUser.role !== "ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await request.formData();
        const title = formData.get("title") as string;
        const file = formData.get("file") as File;
        const order = Number(formData.get("order")) || 0;
        const isActive = formData.get("isActive") === "true";

        if (!title || !file) {
            return NextResponse.json({ error: "Title and Image file are required" }, { status: 400 });
        }

        const supabase = getSupabaseServer();

        // 1. Upload to Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('banners')
            .upload(filePath, file);

        if (uploadError) {
            console.error("Upload error:", uploadError);
            return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('banners')
            .getPublicUrl(filePath);

        // 3. Insert Record
        const { data, error } = await supabase
            .from("Banner")
            .insert([
                {
                    title,
                    imageUrl: publicUrl,
                    order,
                    isActive,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating banner:", error);
            return NextResponse.json({ error: "Failed to create banner" }, { status: 500 });
        }

        return NextResponse.json({ banner: data });
    } catch (error) {
        console.error("Internal server error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
