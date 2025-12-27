import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const visitorId = url.searchParams.get("id");

  if (!visitorId) {
    return NextResponse.json({ banned: false });
  }

  try {
    const result = await convex.query(api.fingerprints.isBanned, { visitorId });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ banned: false });
  }
}
