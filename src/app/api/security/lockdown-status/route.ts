import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const lockdown = await convex.query(api.security.getEmergencyLockdown, {});
    
    return NextResponse.json({
      active: lockdown?.active || false,
      reason: lockdown?.reason,
      activatedAt: lockdown?.activatedAt,
      activatedBy: lockdown?.activatedBy
    });
  } catch (error) {
    return NextResponse.json({ active: false }, { status: 500 });
  }
}
