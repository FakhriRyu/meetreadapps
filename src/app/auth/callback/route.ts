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
        const allCookies = cookieStore.getAll();

        // Create Supabase client for code exchange
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    flowType: 'pkce',
                    persistSession: false,
                    detectSessionInUrl: false,
                    storageKey: 'mr-auth',
                    storage: {
                        getItem: (key) => {
                            // Try exact match first
                            const exactMatch = cookieStore.get(key)?.value;
                            if (exactMatch) return exactMatch;

                            // FUZZY MATCH: If key looks like a code verifier key, try to find ANY verifier cookie
                            if (key.includes('code-verifier') || key.includes('auth-token')) {
                                const fuzzyMatch = allCookies.find(c => c.name.includes('code-verifier'))?.value;
                                if (fuzzyMatch) {
                                    console.log(`Fuzzy matched verifier for key ${key}`);
                                    return fuzzyMatch;
                                }
                            }
                            return null;
                        },
                        setItem: (key, value) => { },
                        removeItem: (key) => { },
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Exchange error:", error.message);
            const cookieNames = allCookies.map(c => c.name).join(", ");
            const debugInfo = `${error.message} | Cookies: [${cookieNames}]`;
            return NextResponse.redirect(`${origin}/login?error=exchange_failed&msg=${encodeURIComponent(debugInfo)}`);
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

    const allParams = new URLSearchParams(searchParams);
    return NextResponse.redirect(`${origin}/login?error=no_code_in_callback&${allParams.toString()}`);
}
