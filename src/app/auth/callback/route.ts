// @ts-nocheck
import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { SESSION_COOKIE_NAME, createSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const supabase = getSupabaseServer();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.session) {
            const { user } = data.session;
            const email = user.email!;
            const name = user.user_metadata.full_name || user.user_metadata.name || email.split("@")[0];

            // Check if user exists in public.User table
            const { data: dbUser, error: dbError } = await supabase
                .from("User")
                .select("id, name, email, role")
                .eq("email", email.toLowerCase())
                .single();

            let finalUser;

            if (!dbUser) {
                // Create new user if not exists
                const { data: newUser, error: createError } = await supabase
                    .from("User")
                    .insert({
                        name,
                        email: email.toLowerCase(),
                        role: "USER",
                        // passwordHash is now nullable
                    })
                    .select("id, name, email, role")
                    .single();

                if (createError) {
                    console.error("Error creating user:", createError);
                    return NextResponse.redirect(`${origin}/login?error=user_creation_failed`);
                }
                finalUser = newUser;
            } else {
                finalUser = dbUser;
            }

            // Create session cookie
            const session = createSessionCookie({
                id: finalUser.id,
                name: finalUser.name,
                email: finalUser.email,
                role: finalUser.role,
            });

            const response = NextResponse.redirect(`${origin}${next}`);

            response.cookies.set({
                name: SESSION_COOKIE_NAME,
                value: session.token,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                expires: session.expires,
            });

            return response;
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
