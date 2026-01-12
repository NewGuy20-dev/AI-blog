import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const device = await convex.query(api.security.getAuthorizedDevice, {});
    return NextResponse.json({ device: device ? { name: device.name, fingerprint: device.fingerprint, addedAt: device.addedAt } : null });
  } catch {
    return NextResponse.json({ device: null });
  }
}
