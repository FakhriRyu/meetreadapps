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
        return NextResponse.redirect(
            `${origin}/login?error=supabase_error&msg=${encodeURIComponent(error_description)}`
        );
    }

    if (code) {
        const cookieStore = await cookies();
        const allCookies = cookieStore.getAll();

        // Find the PKCE verifier from cookies (try all possible names)
        let codeVerifier: string | null = null;
        for (const cookie of allCookies) {
            if (cookie.name.includes("code-verifier")) {
                // Strip URL encoding and surrounding quotes
                let val = decodeURIComponent(cookie.value);
                val = val.replace(/^"|"$/g, "");
                codeVerifier = val;
                console.log(`Found verifier in cookie: ${cookie.name}`);
                break;
            }
        }

        if (!codeVerifier) {
            const cookieNames = allCookies.map((c) => c.name).join(", ");
            console.error("No code verifier cookie found. Available cookies:", cookieNames);
            return NextResponse.redirect(
                `${origin}/login?error=no_verifier&cookies=${encodeURIComponent(cookieNames)}`
            );
        }

        // Exchange the auth code for a session using direct HTTP call
        // This bypasses the Supabase JS library's internal storage check
        const tokenResponse = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=pkce`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                },
                body: JSON.stringify({
                    auth_code: code,
                    code_verifier: codeVerifier,
                }),
            }
        );

        if (!tokenResponse.ok) {
            const errorBody = await tokenResponse.text();
            console.error("Token exchange failed:", tokenResponse.status, errorBody);
            return NextResponse.redirect(
                `${origin}/login?error=exchange_failed&msg=${encodeURIComponent(errorBody)}`
            );
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;
        const email = tokenData.user?.email;
        const name =
            tokenData.user?.user_metadata?.full_name ||
            tokenData.user?.user_metadata?.name ||
            (email ? email.split("@")[0] : "User");

        if (!email) {
            console.error("No email in token response:", JSON.stringify(tokenData.user));
            return NextResponse.redirect(`${origin}/login?error=no_email`);
        }

        // Use service role for database operations
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Find or create user in our DB
        const { data: dbUser } = await supabaseAdmin
            .from("User")
            .select("id, name, email, role")
            .eq("email", email.toLowerCase())
            .single();

        let finalUser;

        if (!dbUser) {
            const timestamp = new Date().toISOString();
            const { data: newUser, error: createError } = await supabaseAdmin
                .from("User")
                .insert({
                    name,
                    email: email.toLowerCase(),
                    role: "USER",
                    createdAt: timestamp,
                    updatedAt: timestamp,
                })
                .select("id, name, email, role")
                .single();

            if (createError) {
                console.error("DB User Creation Error:", createError.message, createError.details, createError.hint);
                return NextResponse.redirect(`${origin}/login?error=db_error&msg=${encodeURIComponent(createError.message)}`);
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

        // Clean up verifier cookies
        for (const cookie of allCookies) {
            if (cookie.name.includes("code-verifier")) {
                response.cookies.set({
                    name: cookie.name,
                    value: "",
                    path: "/",
                    expires: new Date(0),
                });
            }
        }

        return response;
    }

    return NextResponse.redirect(`${origin}/login?error=no_code`);
}
