import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { ip } = await request.json();
    
    const blockedIps = await convex.query('security:checkBlockedIP' as any, { ip });
    
    return NextResponse.json({ blocked: !!blockedIps });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check IP' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { ip, reason } = await request.json();
    
    await convex.mutation('security:blockIP' as any, {
      ip,
      reason: reason || 'Manual block',
      blockedBy: 'admin',
      permanent: true
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to block IP' }, { status: 500 });
  }
}
