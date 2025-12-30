import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const ADMIN_USER_ID = process.env.ADMIN_USER_ID!;

// EMERGENCY ADMIN PROTECTION ENDPOINTS

// Immediately lock down admin account
export async function POST(request: NextRequest) {
  try {
    const { reason, emergencyKey } = await request.json();
    
    if (emergencyKey !== process.env.EMERGENCY_LOCKDOWN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await convex.mutation('security:lockdownAdminAccount' as any, {
      userId: ADMIN_USER_ID,
      reason: reason || 'Emergency lockdown activated'
    });

    await convex.mutation('security:blacklistAllUserTokens' as any, {
      userId: ADMIN_USER_ID,
      reason: 'Emergency lockdown'
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Admin account locked down immediately' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Lockdown failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const recentEvents = await convex.query('security:getRecentSecurityEvents' as any, {
      userId: ADMIN_USER_ID,
      hours: 24
    });

    const criticalEvents = recentEvents.filter((e: any) => e.severity === 'critical');
    const suspiciousEvents = recentEvents.filter((e: any) => 
      e.severity === 'high' || e.severity === 'medium'
    );

    return NextResponse.json({
      adminUserId: ADMIN_USER_ID,
      status: criticalEvents.length > 0 ? 'CRITICAL' : 
              suspiciousEvents.length > 5 ? 'HIGH_RISK' : 'NORMAL',
      criticalEvents: criticalEvents.length,
      suspiciousEvents: suspiciousEvents.length,
      lastActivity: recentEvents[0]?.timestamp || null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Status check failed' }, { status: 500 });
  }
}
