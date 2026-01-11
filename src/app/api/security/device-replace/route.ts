import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import * as sshpk from 'sshpk';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { challenge, signature, newDevice } = await request.json();

    if (!challenge || !signature || !newDevice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get challenge from DB
    const challengeDoc = await convex.query(api.security.getLockdownChallenge, { challenge });
    if (!challengeDoc || challengeDoc.used || Date.now() > challengeDoc.expiresAt) {
      return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 403 });
    }

    // Get existing device
    const existingDevice = await convex.query(api.security.getAuthorizedDevice, {});
    if (!existingDevice) {
      return NextResponse.json({ error: 'No existing device to replace' }, { status: 400 });
    }

    // Verify signature against EXISTING device's public key
    try {
      const publicKey = sshpk.parseKey(existingDevice.publicKey, 'ssh');
      const verifier = publicKey.createVerify('sha256');
      verifier.update(Buffer.from(challenge));
      const sig = sshpk.parseSignature(signature, publicKey.type as 'rsa' | 'dsa' | 'ecdsa' | 'ed25519', 'ssh');
      if (!verifier.verify(sig)) {
        return NextResponse.json({ error: 'Invalid signature - must sign with existing device key' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 403 });
    }

    // Mark challenge as used
    await convex.mutation(api.security.markChallengeUsed, { challengeId: challengeDoc._id });

    // Replace device
    await convex.mutation(api.security.replaceAuthorizedDevice, {
      oldDeviceId: existingDevice._id,
      name: newDevice.name,
      publicKey: newDevice.publicKey,
      keyType: newDevice.keyType,
      fingerprint: newDevice.fingerprint
    });

    return NextResponse.json({ success: true, message: 'Device replaced' });
  } catch (error) {
    console.error('Device replace error:', error);
    return NextResponse.json({ error: 'Failed to replace device' }, { status: 500 });
  }
}
