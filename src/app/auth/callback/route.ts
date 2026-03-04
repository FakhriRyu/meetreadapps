// @ts-nocheck
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SESSION_COOKIE_NAME, createSessionCookie } from "@/lib/auth";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error_description = searchParams.get("error_description");
    const next = searchParams.get("next") ?? "/";

    if (error_description) {
        console.error("Supabase Auth Error:", error_description);
        return NextResponse.redirect(`${origin}/login?error=supabase_error&msg=${encodeURIComponent(error_description)}`);
    }

    if (code) {
        const cookieStore = await cookies();

        // Create Supabase client for code exchange
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    flowType: 'pkce',
                    persistSession: false,
                    detectSessionInUrl: false,
                    storage: {
                        getItem: (key) => cookieStore.get(key)?.value,
                        setItem: (key, value, options) => {
                            // Not usually needed for exchange but set for completeness
                        },
                        removeItem: (key, options) => {
                            // Not usually needed
                        },
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Exchange error:", error.message);
            return NextResponse.redirect(`${origin}/login?error=exchange_failed&msg=${encodeURIComponent(error.message)}`);
        }

        if (data?.session) {
            const { user } = data.session;
            const email = user.email!;
            const name = user.user_metadata.full_name || user.user_metadata.name || email.split("@")[0];

            // Use service role for DB operations
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { persistSession: false } }
            );

            // Check user existence
            const { data: dbUser, error: dbError } = await supabaseAdmin
                .from("User")
                .select("id, name, email, role")
                .eq("email", email.toLowerCase())
                .single();

            let finalUser;

            if (!dbUser) {
                // Auto-register
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
                    console.error("DB Create Error:", createError.message);
                    return NextResponse.redirect(`${origin}/login?error=db_error&msg=${encodeURIComponent(createError.message)}`);
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

    // If we reach here without a code, something is very wrong (likely tokens in hash)
    const allParams = new URLSearchParams(searchParams);
    return NextResponse.redirect(`${origin}/login?error=no_code_in_callback&${allParams.toString()}`);
}
