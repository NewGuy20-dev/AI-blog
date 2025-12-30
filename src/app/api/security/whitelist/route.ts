import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const ADMIN_USER_ID = process.env.ADMIN_USER_ID!;

export async function POST(request: NextRequest) {
  try {
    const { 
      fingerprint, 
      ip, 
      userAgent, 
      timezone,
      emergencyKey 
    } = await request.json();

    if (emergencyKey === process.env.ADMIN_EMERGENCY_KEY) {
      await convex.mutation('security:addTrustedDevice' as any, {
        userId: ADMIN_USER_ID,
        fingerprint,
        ip,
        userAgent: 'trusted',
        timezone: 'trusted',
        trustedAt: Date.now()
      });
      return NextResponse.json({ 
        trusted: true, 
        reason: 'Emergency access granted' 
      });
    }

    await convex.mutation('security:addTrustedDevice' as any, {
      userId: ADMIN_USER_ID,
      fingerprint,
      ip,
      userAgent,
      timezone,
      trustedAt: Date.now()
    });

    return NextResponse.json({ 
      trusted: true, 
      message: 'Device added to trusted list' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to whitelist' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               '127.0.0.1';
    const fingerprint = request.headers.get('x-fingerprint');
    
    const isTrusted = await convex.query('security:isTrustedDevice' as any, {
      userId: ADMIN_USER_ID,
      fingerprint: fingerprint || '',
      ip
    });

    return NextResponse.json({ 
      trusted: isTrusted,
      ip,
      fingerprint: fingerprint || 'none'
    });
  } catch (error) {
    return NextResponse.json({ trusted: false }, { status: 500 });
  }
}
