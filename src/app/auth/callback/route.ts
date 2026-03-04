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

        // Create Supabase client with a storage proxy that can find the verifier cookie
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    flowType: 'pkce',
                    persistSession: false,
                    detectSessionInUrl: false,
                    // No storageKey here to use defaults
                    storage: {
                        getItem: (key) => {
                            // 1. Try exact key match (including storageKey prefix)
                            const exactValue = cookieStore.get(key)?.value;
                            if (exactValue) return exactValue;

                            // 2. Fallback: Search all cookies for ANY code verifier cookie
                            // This handles different naming conventions between libraries/versions
                            const verifierCookie = allCookies.find(c =>
                                c.name.includes('code-verifier') ||
                                c.name.endsWith('auth-token-code-verifier')
                            );

                            if (verifierCookie) {
                                console.log(`Manually found verifier: ${verifierCookie.name}`);
                                return verifierCookie.value;
                            }

                            console.error(`Missing verifier for code exchange. Keys looked for: ${key}`);
                            return null;
                        },
                        setItem: () => { },
                        removeItem: () => { },
                    },
                },
            }
        );

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
            console.error("Exchange error:", error.message);
            // Append cookie list to help debug if it fails again
            const cookieNames = allCookies.map(c => c.name).join(", ");
            return NextResponse.redirect(`${origin}/login?error=exchange_failed&msg=${encodeURIComponent(error.message)}&cookies=${encodeURIComponent(cookieNames)}`);
        }

        if (data?.session) {
            const { user } = data.session;
            const email = user.email!;
            const name = user.user_metadata.full_name || user.user_metadata.name || email.split("@")[0];

            // Use service role for database operations to ensure user creation/lookup works regardless of RLS
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { persistSession: false } }
            );

            // Find or create user in our DB
            const { data: dbUser, error: dbError } = await supabaseAdmin
                .from("User")
                .select("id, name, email, role")
                .eq("email", email.toLowerCase())
                .single();

            let finalUser;

            if (!dbUser) {
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
                    console.error("DB User Creation Error:", createError.message);
                    return NextResponse.redirect(`${origin}/login?error=db_error`);
                }
                finalUser = newUser;
            } else {
                finalUser = dbUser;
            }

            // Create our custom HMAC-signed session cookie
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

    // No code present in the URL
    return NextResponse.redirect(`${origin}/login?error=no_code`);
}
