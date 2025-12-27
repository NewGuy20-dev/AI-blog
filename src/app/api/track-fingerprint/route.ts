import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { visitorId, userId, ip } = body;
    const userAgent = request.headers.get("user-agent") || undefined;

    if (!visitorId) {
      return NextResponse.json({ success: false, banned: false });
    }

    const result = await convex.mutation(api.fingerprints.track, {
      visitorId,
      userId,
      ip,
      userAgent,
    });

    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json({ success: false, banned: false });
  }
}
