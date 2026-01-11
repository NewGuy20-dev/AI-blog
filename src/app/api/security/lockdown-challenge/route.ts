import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { randomBytes } from 'crypto';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Rate limiting: 5 challenges per minute per IP
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 1000; // 1 minute

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         '127.0.0.1';
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  
  // Filter to only timestamps within the window
  const recent = timestamps.filter(t => now - t < RATE_WINDOW);
  
  if (recent.length >= RATE_LIMIT) {
    return false; // Rate limited
  }
  
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  // Check rate limit
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { status: 429 }
    );
  }

  try {
    // Generate cryptographically random challenge
    const challenge = randomBytes(32).toString('base64');
    
    // Store challenge in DB with 5 minute expiry
    await convex.mutation(api.security.storeLockdownChallenge, { challenge });
    
    return NextResponse.json({ challenge });
  } catch (error) {
    console.error('Challenge generation error:', error);
    return NextResponse.json({ error: 'Failed to generate challenge' }, { status: 500 });
  }
}
