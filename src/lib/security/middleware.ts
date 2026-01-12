import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

interface SecurityContext {
  ip: string;
  userAgent: string;
  timezone: string;
  fingerprint?: string;
  riskScore: number;
}

// Get base URL for internal API calls
function getBaseUrl(request: NextRequest): string {
  return request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// Module-level base URL (set on first request)
let cachedBaseUrl: string | null = null;

export async function securityMiddleware(request: NextRequest) {
  // Cache base URL from first request
  if (!cachedBaseUrl) {
    cachedBaseUrl = getBaseUrl(request);
  }

  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const timezone = request.headers.get('x-timezone') || 'UTC';
  
  // Check emergency lockdown first
  const lockdown = await checkEmergencyLockdown();
  if (lockdown?.active) {
    return new NextResponse('System in Emergency Lockdown', { status: 503 });
  }
  
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

// Build absolute URL for internal API calls
function apiUrl(path: string): string {
  const base = cachedBaseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${base}${path}`;
}

async function validateJWT(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Check if token is blacklisted
    const isBlacklisted = await fetch(apiUrl('/api/security/check-token'), {
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
  const response = await fetchWithTimeout(apiUrl('/api/security/check-ip'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ip })
  });
  
  if (!response) return false; // Fail-open on timeout
  try {
    const result = await response.json();
    return result.blocked;
  } catch {
    return false;
  }
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
  const response = await fetchWithTimeout(apiUrl('/api/security/check-hardware-ban'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fingerprint })
  });
  
  if (!response) return false; // Fail-open on timeout
  try {
    const result = await response.json();
    return result.banned;
  } catch {
    return false;
  }
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

// IP-API.com free VPN/Proxy detection
interface IPApiResponse {
  status: string;
  proxy: boolean;
  hosting: boolean;
  mobile: boolean;
  timezone: string;
  isp: string;
  org: string;
  as: string;
}

let ipApiCache: Map<string, { data: IPApiResponse; expires: number }> = new Map();

// Lockdown status cache (30s TTL)
let lockdownCache: { active: boolean; data: any; expires: number } | null = null;
const LOCKDOWN_CACHE_TTL = 30 * 1000; // 30 seconds

async function getIPApiData(ip: string): Promise<IPApiResponse | null> {
  // Skip localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.')) {
    return null;
  }
  
  // Check cache (5 min TTL)
  const cached = ipApiCache.get(ip);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,proxy,hosting,mobile,timezone,isp,org,as`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'success') {
      ipApiCache.set(ip, { data, expires: Date.now() + 5 * 60 * 1000 });
      return data;
    }
  } catch {
    // Fail silently
  }
  return null;
}

async function checkIPQualityScore(ip: string) {
  const data = await getIPApiData(ip);
  return { detected: data?.proxy || false, service: 'ip-api-proxy' };
}

async function checkMaxMind(ip: string) {
  const data = await getIPApiData(ip);
  return { detected: data?.hosting || false, service: 'ip-api-hosting' };
}

async function checkCustomVPNList(ip: string) {
  const data = await getIPApiData(ip);
  // Check for known VPN ASNs
  const vpnAsns = ['AS9009', 'AS20473', 'AS46562', 'AS62041', 'AS212238'];
  const isVpnAsn = vpnAsns.some(asn => data?.as?.includes(asn));
  return { detected: isVpnAsn, service: 'vpn-asn-list' };
}

async function checkASNReputation(ip: string) {
  const data = await getIPApiData(ip);
  // Check for datacenter/hosting keywords in org
  const dcKeywords = ['hosting', 'cloud', 'server', 'datacenter', 'vps', 'digital ocean', 'aws', 'azure', 'google'];
  const isDc = dcKeywords.some(kw => data?.org?.toLowerCase().includes(kw) || data?.isp?.toLowerCase().includes(kw));
  return { detected: isDc, service: 'org-check' };
}

async function detectProxy(ip: string) {
  const data = await getIPApiData(ip);
  return { detected: data?.proxy || false };
}

async function detectDatacenter(ip: string) {
  const data = await getIPApiData(ip);
  return { detected: data?.hosting || false };
}

async function getIPGeolocation(ip: string) {
  const data = await getIPApiData(ip);
  return { timezone: data?.timezone || null };
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

// Helper for fetch with timeout (fail-open on timeout/error)
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 2000): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch {
    return null; // Fail-open
  } finally {
    clearTimeout(timeout);
  }
}

async function logSecurityEvent(event: any) {
  // Fire-and-forget, don't block on logging
  fetchWithTimeout(apiUrl('/api/security/log-event'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  }, 1000);
}

async function checkEmergencyLockdown() {
  // Check cache first
  if (lockdownCache && lockdownCache.expires > Date.now()) {
    return lockdownCache.data;
  }

  const response = await fetchWithTimeout(`${process.env.NEXT_PUBLIC_CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: 'security:getEmergencyLockdown',
      args: {}
    })
  });

  if (!response) return null; // Fail-open on timeout/error

  try {
    const result = await response.json();
    const data = result.value;
    
    // Cache the result
    lockdownCache = {
      active: data?.active || false,
      data,
      expires: Date.now() + LOCKDOWN_CACHE_TTL
    };
    
    return data;
  } catch {
    return null;
  }
}
