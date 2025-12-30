import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { jti } = await request.json();
    
    const isBlacklisted = await convex.query('security:isTokenBlacklisted' as any, { jti });
    
    return NextResponse.json({ blacklisted: isBlacklisted });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check token' }, { status: 500 });
  }
}
