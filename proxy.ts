import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Phase 4: per-instance cache for admin_settings.announcement_mode.
// announcement_mode = graceful page block (API keeps running for in-flight
// readings). The old maintenance_mode key is retired (dormant in DB).
// Fail-CLOSED: a read error locks the site; a missing key means OFF
// (deploy SQL before code so the key always exists).
let announcementCache: { value: { enabled: boolean; ok: boolean }; at: number } | null = null;
const ANNOUNCE_TTL_MS = 30_000;

async function getAnnouncementCached(
  supabase: ReturnType<typeof createServerClient>
): Promise<{ enabled: boolean; ok: boolean }> {
  const now = Date.now();
  if (announcementCache && now - announcementCache.at < ANNOUNCE_TTL_MS) {
    return announcementCache.value;
  }
  try {
    const { data, error } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "announcement_mode")
      .single();
    if (error) throw error;
    const v = { enabled: (data?.value as { enabled?: boolean } | null)?.enabled ?? false, ok: true };
    announcementCache = { value: v, at: now };
    return v;
  } catch {
    const v = { enabled: true, ok: false }; // fail-closed
    announcementCache = { value: v, at: now };
    return v;
  }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAdmin = request.nextUrl.pathname.startsWith("/admin");
  const isApi = request.nextUrl.pathname.startsWith("/api");
  const isRoot = request.nextUrl.pathname === "/";

  // Auth redirects
  if (!user && isDashboard) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (!user && isAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (user && isRoot) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Server-side admin check — cache result for maintenance reuse
  let isAdminUser: boolean | null = null;
  if (user && isAdmin) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdminUser = !!profile?.is_admin;
    if (!isAdminUser) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Announcement mode: block non-admin, non-auth pages (skip for /api so
  // in-flight AI streams drain gracefully). Fail-closed on read errors.
  if (!isAdmin && !isApi) {
    const announcement = await getAnnouncementCached(supabase as unknown as ReturnType<typeof createServerClient>);
    if (announcement.enabled && !isRoot) {
      if (user) {
        if (isAdminUser === null) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();
          isAdminUser = !!profile?.is_admin;
        }
        if (!isAdminUser) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  // Security headers
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
  supabaseResponse.headers.set("X-Frame-Options", "DENY");
  supabaseResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  supabaseResponse.headers.set("X-XSS-Protection", "1; mode=block");

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
