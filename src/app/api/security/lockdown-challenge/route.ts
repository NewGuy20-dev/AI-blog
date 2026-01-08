import { NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { randomBytes } from 'crypto';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST() {
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
