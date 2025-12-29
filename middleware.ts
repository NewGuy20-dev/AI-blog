import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./src/lib/auth0";

// Known VPN/Proxy ASN ranges and datacenter IPs
const BLOCKED_ASN_KEYWORDS = [
  "digitalocean", "linode", "vultr", "aws", "amazon", "google cloud", 
  "microsoft azure", "ovh", "hetzner", "contabo", "hostinger",
  "expressvpn", "nordvpn", "surfshark", "protonvpn", "mullvad",
  "private internet access", "cyberghost", "ipvanish", "tunnelbear"
];

export async function middleware(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || request.headers.get("cf-connecting-ip")
    || "unknown";

  // Skip for static assets and API routes that need to work
  const path = request.nextUrl.pathname;
  if (path.startsWith("/_next") || path.startsWith("/api/check-ip") || path === "/blocked") {
    return auth0.middleware(request);
  }

  // Check IP block and VPN status
  try {
    const baseUrl = request.nextUrl.origin;
    const checkRes = await fetch(`${baseUrl}/api/check-ip`, {
      headers: { "x-forwarded-for": ip },
    });
    
    if (checkRes.ok) {
      const { blocked, isVpn } = await checkRes.json();
      
      // Block if IP is banned
      if (blocked) {
        return new NextResponse("Access Denied", { status: 403 });
      }
      
      // Block VPN/Proxy users from protected routes
      if (isVpn && (path.startsWith("/admin") || path.startsWith("/profile"))) {
        return new NextResponse("VPN/Proxy detected. Please disable to access this page.", { status: 403 });
      }
    }
  } catch {
    // Continue if check fails
  }

  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons|logo|manifest.json|sw.js).*)",
  ],
};
