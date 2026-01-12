import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { randomBytes } from 'crypto';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Rate limiting: 5 challenges per minute per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000; // 1 minute
const MAX_TRACKED_IPS = 1000; // Memory bound

// Cleanup stale entries periodically
function cleanupRateLimitMap() {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const recent = timestamps.filter(t => now - t < RATE_WINDOW);
    if (recent.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, recent);
    }
  }
  // Evict oldest if over limit
  if (rateLimitMap.size > MAX_TRACKED_IPS) {
    const entries = Array.from(rateLimitMap.entries());
    entries.sort((a, b) => Math.max(...a[1]) - Math.max(...b[1]));
    const toDelete = entries.slice(0, rateLimitMap.size - MAX_TRACKED_IPS);
    toDelete.forEach(([ip]) => rateLimitMap.delete(ip));
  }
}

// Run cleanup every 30 seconds
setInterval(cleanupRateLimitMap, 30 * 1000);

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         '127.0.0.1';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter(t => now - t < RATE_WINDOW);
  
  if (recent.length >= RATE_LIMIT) {
    return false;
  }
  
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    );
  }

  try {
    const challenge = randomBytes(32).toString('base64');
    await convex.mutation(api.security.storeLockdownChallenge, { challenge });
    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}
