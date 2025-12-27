import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Get client IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || request.headers.get("x-real-ip") 
    || "unknown";

  // Skip check for API routes and static files
  if (
    request.nextUrl.pathname.startsWith("/api/") ||
    request.nextUrl.pathname.startsWith("/_next/") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if IP is blocked via Convex HTTP API
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return NextResponse.next();

    const res = await fetch(`${convexUrl.replace(".cloud", ".site")}/api/blocked-ip?ip=${encodeURIComponent(ip)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (data.blocked) {
        return new NextResponse(
          `<html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0d1117;color:#fff;flex-direction:column;">
            <h1>Access Denied</h1>
            <p style="color:#888;">Your IP address has been blocked.</p>
            ${data.reason ? `<p style="color:#666;font-size:14px;">Reason: ${data.reason}</p>` : ""}
          </body></html>`,
          { status: 403, headers: { "Content-Type": "text/html" } }
        );
      }
    }
  } catch {
    // If check fails, allow access (fail open)
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
