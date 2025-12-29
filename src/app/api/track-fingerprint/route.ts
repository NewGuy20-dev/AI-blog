import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { createHash } from "crypto";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Server-side fingerprint from headers (can't be spoofed by cookie editor)
function getServerFingerprint(req: Request): string {
  const parts = [
    req.headers.get("user-agent") || "",
    req.headers.get("accept-language") || "",
    req.headers.get("sec-ch-ua") || "",
    req.headers.get("sec-ch-ua-platform") || "",
  ];
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

// Detect cookie editor / spoofing attempts
function detectSpoofing(req: Request, body: any): string[] {
  const reasons: string[] = [];
  const ua = req.headers.get("user-agent") || "";

  // Missing/fake UA
  if (!ua || ua.length < 20) reasons.push("bad_ua");
  
  // Bot patterns
  if (/curl|wget|python|postman|puppeteer|selenium|headless/i.test(ua)) reasons.push("bot");
  
  // Missing browser security headers
  if (!req.headers.get("sec-fetch-site") && !req.headers.get("sec-fetch-mode")) reasons.push("no_sec_headers");
  
  // Fingerprint too short/invalid
  if (!body.visitorId || body.visitorId.length < 10) reasons.push("invalid_fp");

  return reasons;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitorId, userId } = body;
    const userAgent = request.headers.get("user-agent") || undefined;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip") || "unknown";

    if (!visitorId) {
      return NextResponse.json({ success: false, banned: false });
    }

    const serverFp = getServerFingerprint(request);
    const spoofReasons = detectSpoofing(request, body);

    const result = await convex.mutation(api.fingerprints.track, {
      visitorId,
      userId,
      ip,
      userAgent,
      serverFingerprint: serverFp,
      spoofReasons: spoofReasons.length > 0 ? spoofReasons : undefined,
    });

    // Auto-ban if spoofing + existing risk
    if (spoofReasons.length >= 2 && result.riskScore >= 3) {
      return NextResponse.json({ success: true, banned: true, reason: "Spoofing detected" });
    }

    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ success: false, banned: false });
  }
}
