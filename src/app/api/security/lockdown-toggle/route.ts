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

    if (action !== 'on' && action !== 'off') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get authorized device public key
    const device = await convex.query(api.security.getAuthorizedDevice, {});
    if (!device) {
      return NextResponse.json({ error: 'No authorized device found' }, { status: 403 });
    }

    // Verify signature first (before consuming challenge)
    try {
      const publicKey = sshpk.parseKey(device.publicKey, 'ssh');
      const hashAlg = publicKey.type === 'ed25519' ? 'sha512' : 'sha256';
      const verifier = publicKey.createVerify(hashAlg);
      verifier.update(Buffer.from(challenge));
      const sig = sshpk.parseSignature(signature, publicKey.type as 'rsa' | 'dsa' | 'ecdsa' | 'ed25519', 'ssh');
      if (!verifier.verify(sig)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 403 });
    }

    // Atomic challenge validation and consumption
    const challengeResult = await convex.mutation(api.security.useAndValidateChallenge, { challenge });
    if (!challengeResult.valid) {
      return NextResponse.json({ error: challengeResult.error }, { status: 403 });
    }

    // Toggle lockdown
    if (action === 'on') {
      await convex.mutation(api.security.setEmergencyLockdown, {
        active: true,
        reason: 'SSH key authenticated toggle',
        activatedBy: device.name
      });
    } else {
      const lockdown = await convex.query(api.security.getEmergencyLockdown, {});
      if (lockdown) {
        await convex.mutation(api.security.deactivateEmergencyLockdown, { lockdownId: lockdown._id });
      }
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
