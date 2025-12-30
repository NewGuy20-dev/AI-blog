import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const ADMIN_USER_ID = process.env.ADMIN_USER_ID!;

export async function adminProtectionMiddleware(request: NextRequest) {
  const url = request.nextUrl.pathname;
  
  if (url.startsWith('/admin')) {
    const userId = getUserIdFromToken(request);
    
    if (userId !== ADMIN_USER_ID) {
      await logSecurityEvent({
        userId,
        ip: getClientIP(request),
        userAgent: request.headers.get('user-agent') || '',
        eventType: 'unauthorized_admin_access',
        severity: 'critical',
        details: { 
          suspiciousActivity: ['admin_impersonation', url]
        },
        blocked: true
      });
      
      return new NextResponse('Access Denied', { status: 403 });
    }

    const validation = await validateAdminAccess(request, userId);
    if (!validation.allowed) {
      return new NextResponse(validation.reason, { status: 403 });
    }
  }

  return NextResponse.next();
}

async function validateAdminAccess(request: NextRequest, userId: string) {
  const ip = getClientIP(request);
  const fingerprint = request.headers.get('x-fingerprint') || '';
  
  // Check if trusted device first
  const isTrusted = await convex.query('security:isTrustedDevice' as any, {
    userId,
    fingerprint,
    ip
  });

  if (isTrusted) {
    return { allowed: true, reason: 'Trusted device access' };
  }

  // Check for suspicious events
  const recentEvents = await convex.query('security:getRecentSecurityEvents' as any, {
    userId,
    hours: 1
  });
  
  const suspiciousEvents = recentEvents?.filter((e: any) => 
    e.severity === 'high' || e.severity === 'critical'
  ) || [];
  
  if (suspiciousEvents.length > 3) {
    await convex.mutation('security:lockdownAdminAccount' as any, {
      userId,
      reason: 'Multiple suspicious events detected'
    });
    
    return { 
      allowed: false, 
      reason: 'Admin account temporarily locked due to suspicious activity' 
    };
  }

  // Auto-add to trusted devices
  await convex.mutation('security:addTrustedDevice' as any, {
    userId,
    fingerprint,
    ip,
    userAgent: request.headers.get('user-agent') || '',
    timezone: request.headers.get('x-timezone') || 'UTC',
    trustedAt: Date.now()
  });

  return { allowed: true, reason: 'New device validated and added to trusted list' };
}

function getUserIdFromToken(request: NextRequest): string | null {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch {
    return null;
  }
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         '127.0.0.1';
}

async function logSecurityEvent(event: any) {
  await fetch('/api/security/log-event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
}
