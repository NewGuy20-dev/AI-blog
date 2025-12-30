import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { 
      fingerprint,
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint 
    } = await request.json();

    const banned = await convex.query('security:isHardwareBanned' as any, {
      fingerprint,
      canvasFingerprint,
      webglFingerprint,
      audioFingerprint
    });

    return NextResponse.json({ banned });
  } catch (error) {
    return NextResponse.json({ banned: false }, { status: 500 });
  }
}
