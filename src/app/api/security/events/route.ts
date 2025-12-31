import { NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET() {
  try {
    const events = await convex.query('security:getRecentEvents' as any, { limit: 100 });
    
    return NextResponse.json({ 
      events: events?.map((e: any) => ({
        id: e._id,
        eventType: e.eventType,
        severity: e.severity,
        userId: e.userId,
        ip: e.ip,
        userAgent: e.userAgent,
        timestamp: e.timestamp,
        blocked: e.blocked,
        details: e.details
      })) || []
    });
  } catch (error) {
    console.error('Failed to load events:', error);
    return NextResponse.json({ events: [] });
  }
}
