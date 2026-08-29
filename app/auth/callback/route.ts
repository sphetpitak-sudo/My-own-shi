import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const rawNext = searchParams.get("next") ?? "/dashboard";
  // Protect against open redirect attacks (ensure next is a relative path)
  const safeNext = (rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.startsWith("/\\"))
    ? rawNext
    : "/dashboard";
  const code = searchParams.get("code");

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase env vars in callback");
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }

    const cookies = request.cookies;
    const response = NextResponse.redirect(`${origin}${safeNext}`);

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }

    console.error("exchangeCodeForSession error:", error.message);
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
