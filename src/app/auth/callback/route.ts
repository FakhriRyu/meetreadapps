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

        // Helper to clean cookie values (strip quotes often added by supabase-js/browsers)
        const cleanValue = (val: string | undefined | null) => {
            if (!val) return null;
            // Decode and strip leading/trailing quotes
            let cleaned = decodeURIComponent(val).replace(/^"|"$/g, '');
            // Sometimes it's double encoded or has escaped quotes
            cleaned = cleaned.replace(/^%22|%22$/g, '').replace(/^"|"$/g, '');
            return cleaned;
        };

        // Create Supabase client with a storage proxy that handles quote stripping
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    flowType: 'pkce',
                    persistSession: false,
                    detectSessionInUrl: false,
                    storage: {
                        getItem: (key) => {
                            // 1. Try exact key match
                            const exactValue = cookieStore.get(key)?.value;
                            if (exactValue) {
                                const cleaned = cleanValue(exactValue);
                                console.log(`Found exact key ${key}, cleaned: ${cleaned ? 'YES' : 'NO'}`);
                                return cleaned;
                            }

                            // 2. Fallback: Search all cookies for ANY code verifier cookie
                            // This is helpful if storageKey or project ref naming varies
                            const verifierCookie = allCookies.find(c =>
                                c.name.includes('code-verifier') ||
                                c.name.endsWith('auth-token-code-verifier')
                            );

                            if (verifierCookie) {
                                const cleaned = cleanValue(verifierCookie.value);
                                console.log(`Manually found verifier ${verifierCookie.name}, cleaned: ${cleaned ? 'YES' : 'NO'}`);
                                return cleaned;
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
            const cookieList = allCookies.map(c => `${c.name}=${c.value.substring(0, 10)}...`).join(", ");
            return NextResponse.redirect(`${origin}/login?error=exchange_failed&msg=${encodeURIComponent(error.message)}&debug_cookies=${encodeURIComponent(cookieList)}`);
        }

        if (data?.session) {
            const { user } = data.session;
            const email = user.email!;
            const name = user.user_metadata.full_name || user.user_metadata.name || email.split("@")[0];

            // Use service role for database operations
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { persistSession: false } }
            );

            // Find or create user
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
        }
    }

    return NextResponse.redirect(`${origin}/login?error=no_code`);
}
