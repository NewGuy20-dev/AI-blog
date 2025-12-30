import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const eventData = await request.json();
    
    await convex.mutation('security:logSecurityEvent' as any, eventData);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to log event' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, reason } = await request.json();
    
    await convex.mutation('security:blacklistAllUserTokens' as any, {
      userId,
      reason: reason || 'Emergency lockdown'
    });
    
    return NextResponse.json({ success: true, message: 'User locked down' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to lockdown user' }, { status: 500 });
  }
}
