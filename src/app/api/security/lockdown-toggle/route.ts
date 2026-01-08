import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import * as sshpk from 'sshpk';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { challenge, signature, action } = await request.json();
    
    if (!challenge || !signature || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get challenge from DB
    const challengeDoc = await convex.query(api.security.getLockdownChallenge, { challenge });
    
    if (!challengeDoc) {
      return NextResponse.json({ error: 'Invalid challenge' }, { status: 403 });
    }

    if (challengeDoc.used) {
      return NextResponse.json({ error: 'Challenge already used' }, { status: 403 });
    }

    if (Date.now() > challengeDoc.expiresAt) {
      return NextResponse.json({ error: 'Challenge expired' }, { status: 403 });
    }

    // Get authorized device public key
    const device = await convex.query(api.security.getAuthorizedDevice, {});
    
    if (!device) {
      return NextResponse.json({ error: 'No authorized device found' }, { status: 403 });
    }

    // Verify signature
    try {
      const publicKey = sshpk.parseKey(device.publicKey, 'ssh');
      const verifier = publicKey.createVerify('sha256');
      verifier.update(Buffer.from(challenge));
      
      const sig = sshpk.parseSignature(signature, publicKey.type, 'ssh');
      const valid = verifier.verify(sig);
      
      if (!valid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    } catch (error) {
      console.error('Signature verification error:', error);
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 403 });
    }

    // Mark challenge as used
    await convex.mutation(api.security.markChallengeUsed, { challengeId: challengeDoc._id });

    // Toggle lockdown
    if (action === 'on') {
      await convex.mutation(api.security.setEmergencyLockdown, {
        active: true,
        reason: 'SSH key authenticated toggle',
        activatedBy: device.name
      });
    } else if (action === 'off') {
      const lockdown = await convex.query(api.security.getEmergencyLockdown, {});
      if (lockdown) {
        await convex.mutation(api.security.deactivateEmergencyLockdown, { lockdownId: lockdown._id });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Lockdown ${action === 'on' ? 'activated' : 'deactivated'}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lockdown toggle error:', error);
    return NextResponse.json({ error: 'Failed to toggle lockdown' }, { status: 500 });
  }
}
