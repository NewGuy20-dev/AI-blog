import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const [totalEvents, criticalEvents, blockedIPs, bannedHardware, activeThreats] = await Promise.all([
      convex.query('security:getEventCount' as any, { hours: 24 }).catch(() => ({ count: 0 })),
      convex.query('security:getCriticalEventCount' as any, { hours: 24 }).catch(() => ({ count: 0 })),
      convex.query('security:getBlockedIPCount' as any, {}).catch(() => ({ count: 0 })),
      convex.query('security:getBannedHardwareCount' as any, {}).catch(() => ({ count: 0 })),
      convex.query('security:getActiveThreatsCount' as any, { hours: 1 }).catch(() => ({ count: 0 })),
    ]);

    return NextResponse.json({
      totalEvents: totalEvents?.count || 0,
      criticalEvents: criticalEvents?.count || 0,
      blockedIPs: blockedIPs?.count || 0,
      bannedHardware: bannedHardware?.count || 0,
      activeThreats: activeThreats?.count || 0,
    });
  } catch (error) {
    console.error('Failed to load security stats:', error);
    return NextResponse.json({
      totalEvents: 0, criticalEvents: 0, blockedIPs: 0, bannedHardware: 0, activeThreats: 0
    });
  }
}
