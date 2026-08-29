import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Per-instance cache for admin_settings.maintenance_mode — avoids per-request DB roundtrip on AI paths
let maintenanceCache: { value: { enabled?: boolean } | null; at: number } | null = null;
const MAINT_TTL_MS = 30_000;

async function getMaintenanceCached(supabase: ReturnType<typeof createServerClient>): Promise<{ enabled?: boolean } | null> {
  const now = Date.now();
  if (maintenanceCache && now - maintenanceCache.at < MAINT_TTL_MS) return maintenanceCache.value;
  const { data } = await supabase.from("admin_settings").select("value").eq("key", "maintenance_mode").single();
  const v = (data?.value as { enabled?: boolean } | null) ?? null;
  maintenanceCache = { value: v, at: now };
  return v;
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

  // Maintenance mode: block non-admin, non-auth pages (skip for /api to keep AI latency low)
  if (!isAdmin && !isApi) {
    const maintenance = await getMaintenanceCached(supabase as unknown as ReturnType<typeof createServerClient>);
    if (maintenance?.enabled && !isRoot) {
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
