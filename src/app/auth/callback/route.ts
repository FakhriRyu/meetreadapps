// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SESSION_COOKIE_NAME, createSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/";

    if (code) {
        const cookieStore = await cookies();

        // Create a special client for the callback that can read the PKCE verifier from cookies
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    flowType: 'pkce',
                    persistSession: false,
                    storage: {
                        getItem: (key) => {
                            const cookie = cookieStore.get(key);
                            return cookie ? cookie.value : null;
                        },
                        setItem: (key, value) => {
                            // Not strictly needed for exchange but good for consistency
                        },
                        removeItem: (key) => {
                            // Not strictly needed for exchange
                        },
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error && data?.session) {
            const { user } = data.session;
            const email = user.email!;
            const name = user.user_metadata.full_name || user.user_metadata.name || email.split("@")[0];

            // Use service role for DB operations to ensure we can find/create the user
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { persistSession: false } }
            );

            const { data: dbUser, error: dbError } = await supabaseAdmin
                .from("User")
                .select("id, name, email, role")
                .eq("email", email.toLowerCase())
                .single();

            let finalUser;

            if (!dbUser) {
                // Create new user if not exists
                const { data: newUser, error: createError } = await supabaseAdmin
                    .from("User")
                    .insert({
                        name,
                        email: email.toLowerCase(),
                        role: "USER",
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

            // Create custom session cookie
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
        } else {
            console.error("Exchange error:", error);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
