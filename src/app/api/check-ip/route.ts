import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";

  let isVpn = false;
  let blocked = false;
  let reason: string | undefined;

  // Check if IP is blocked in database
  try {
    const result = await convex.query(api.blockedIps.isBlocked, { ip });
    blocked = result.blocked;
    reason = result.reason;
  } catch {}

  // Check VPN via ip-api.com (free, no API key needed)
  if (!blocked) {
    try {
      const res = await fetch(
        `http://ip-api.com/json/${ip}?fields=proxy,hosting`,
        { next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        isVpn = data.proxy || data.hosting || false;
      }
    } catch {}
  }

  return NextResponse.json({ blocked, reason, ip, isVpn });
}
