import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

interface SecurityContext {
  ip: string;
  userAgent: string;
  timezone: string;
  fingerprint?: string;
  riskScore: number;
}

export async function securityMiddleware(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const timezone = request.headers.get('x-timezone') || 'UTC';
  
  // Check if IP is blocked
  const isBlocked = await checkBlockedIP(ip);
  if (isBlocked) {
    return new NextResponse('Access Denied', { status: 403 });
  }

  // JWT Validation with blacklist check
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (token) {
    const isValid = await validateJWT(token);
    if (!isValid) {
      return new NextResponse('Invalid Token', { status: 401 });
    }
  }

  // VPN/Proxy Detection
  const securityCheck = await performSecurityCheck({
    ip,
    userAgent,
    timezone,
    riskScore: 0,
    fingerprint: request.headers.get('x-fingerprint') || undefined
  });

  if (securityCheck.blocked) {
    return new NextResponse('Security Check Failed', { status: 403 });
  }

  return NextResponse.next();
}

async function validateJWT(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Check if token is blacklisted
    const isBlacklisted = await fetch('/api/security/check-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jti: payload.jti })
    }).then(r => r.json());

    return !isBlacklisted.blacklisted;
  } catch {
    return false;
  }
}

async function checkBlockedIP(ip: string): Promise<boolean> {
  // Check against Convex blockedIps table
  const response = await fetch('/api/security/check-ip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip })
  });
  
  const result = await response.json();
  return result.blocked;
}

async function performSecurityCheck(context: SecurityContext): Promise<{ blocked: boolean; riskScore: number }> {
  // Check if hardware is banned first
  const hardwareBanned = await checkHardwareBan(context.fingerprint || '');
  if (hardwareBanned) {
    await logSecurityEvent({
      ip: context.ip,
      userAgent: context.userAgent,
      eventType: 'banned_hardware_detected',
      severity: 'critical',
      details: {
        fingerprint: context.fingerprint,
        suspiciousActivity: ['banned_hardware_access']
      },
      blocked: true
    });
    return { blocked: true, riskScore: 100 };
  }

  // Enhanced VPN detection
  const vpnCheck = await detectAdvancedVPN(context.ip);
  const proxyCheck = await detectProxy(context.ip);
  const datacenterCheck = await detectDatacenter(context.ip);
  
  // Timezone consistency check
  const timezoneRisk = await checkTimezoneConsistency(context.ip, context.timezone);
  
  let riskScore = 0;
  if (vpnCheck.detected) riskScore += 40;
  if (proxyCheck.detected) riskScore += 35;
  if (datacenterCheck.detected) riskScore += 25;
  if (timezoneRisk.suspicious) riskScore += 20;

  // Log security event
  await logSecurityEvent({
    ip: context.ip,
    userAgent: context.userAgent,
    eventType: 'security_check',
    severity: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
    details: {
      vpnDetected: vpnCheck.detected,
      proxyDetected: proxyCheck.detected,
      datacenterIp: datacenterCheck.detected,
      riskScore,
      timezone: context.timezone,
      timezoneChanged: timezoneRisk.suspicious
    },
    blocked: riskScore > 70
  });

  return { blocked: riskScore > 70, riskScore };
}

async function checkHardwareBan(fingerprint: string): Promise<boolean> {
  const response = await fetch('/api/security/check-hardware-ban', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint })
  });
  
  const result = await response.json();
  return result.banned;
}

async function detectAdvancedVPN(ip: string): Promise<{ detected: boolean; confidence: number }> {
  // Multiple VPN detection methods
  const checks = await Promise.all([
    checkIPQualityScore(ip),
    checkMaxMind(ip),
    checkCustomVPNList(ip),
    checkASNReputation(ip)
  ]);

  const detectionCount = checks.filter(c => c.detected).length;
  const confidence = (detectionCount / checks.length) * 100;

  return {
    detected: detectionCount >= 2, // Require 2+ services to confirm
    confidence
  };
}

async function checkTimezoneConsistency(ip: string, timezone: string): Promise<{ suspicious: boolean; reason?: string }> {
  // Get expected timezone from IP geolocation
  const geoData = await getIPGeolocation(ip);
  const expectedTimezone = geoData.timezone;

  if (!expectedTimezone) return { suspicious: false };

  // Allow some common timezone variations
  const timezoneVariations = getTimezoneVariations(expectedTimezone);
  
  if (!timezoneVariations.includes(timezone)) {
    return {
      suspicious: true,
      reason: `Timezone mismatch: reported ${timezone}, expected ${expectedTimezone}`
    };
  }

  return { suspicious: false };
}

// Placeholder functions - integrate with real services
async function checkIPQualityScore(ip: string) {
  return { detected: Math.random() > 0.8, service: 'IPQualityScore' };
}

async function checkMaxMind(ip: string) {
  return { detected: Math.random() > 0.85, service: 'MaxMind' };
}

async function checkCustomVPNList(ip: string) {
  return { detected: Math.random() > 0.9, service: 'CustomList' };
}

async function checkASNReputation(ip: string) {
  return { detected: Math.random() > 0.75, service: 'ASN' };
}

async function detectProxy(ip: string) {
  return { detected: Math.random() > 0.9 };
}

async function detectDatacenter(ip: string) {
  return { detected: Math.random() > 0.85 };
}

async function getIPGeolocation(ip: string) {
  return { timezone: 'America/New_York' }; // Placeholder
}

function getTimezoneVariations(timezone: string): string[] {
  // Return common variations for a timezone
  const variations: Record<string, string[]> = {
    'America/New_York': ['America/New_York', 'EST', 'EDT', 'US/Eastern'],
    'Europe/London': ['Europe/London', 'GMT', 'BST', 'GB'],
    // Add more as needed
  };
  return variations[timezone] || [timezone];
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
