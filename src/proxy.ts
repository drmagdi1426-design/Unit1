import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, PARTICIPANT_COOKIE, verifySession } from "@/lib/session";

// Route guard (formerly "middleware", renamed to "proxy" in Next.js 16).
// - /admin/**  (except /admin/login) requires a valid admin session.
// - /exam/**   requires a valid participant session (registered test-taker).
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session || session.role !== "admin") {
      const url = new URL("/admin/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/exam")) {
    const token = request.cookies.get(PARTICIPANT_COOKIE)?.value;
    const session = await verifySession(token);
    if (!session || session.role !== "participant") {
      return NextResponse.redirect(new URL("/register", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/exam/:path*"],
};
