import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import * as sshpk from 'sshpk';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { challenge, signature, masterKey } = await request.json();

    if (!challenge || !signature || !masterKey) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate challenge
    const challengeDoc = await convex.query(api.security.getLockdownChallenge, { challenge });
    if (!challengeDoc || challengeDoc.used || Date.now() > challengeDoc.expiresAt) {
      return NextResponse.json({ error: 'Invalid or expired challenge' }, { status: 403 });
    }

    // Get device
    const device = await convex.query(api.security.getAuthorizedDevice, {});
    if (!device) {
      return NextResponse.json({ error: 'No device registered' }, { status: 400 });
    }

    // Verify SSH signature
    try {
      const publicKey = sshpk.parseKey(device.publicKey, 'ssh');
      const verifier = publicKey.createVerify('sha256');
      verifier.update(Buffer.from(challenge));
      const sig = sshpk.parseSignature(signature, publicKey.type as 'rsa' | 'dsa' | 'ecdsa' | 'ed25519', 'ssh');
      if (!verifier.verify(sig)) {
        return NextResponse.json({ error: 'Invalid SSH signature' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'SSH signature verification failed' }, { status: 403 });
    }

    // Validate master key
    const isValidKey = await convex.query(api.admin.validateMasterKey, { key: masterKey });
    if (!isValidKey) {
      return NextResponse.json({ error: 'Invalid master key' }, { status: 403 });
    }

    // Both validations passed - atomic challenge + device removal
    await convex.mutation(api.security.removeDeviceWithChallenge, {
      challengeId: challengeDoc._id,
      deviceId: device._id
    });

    return NextResponse.json({ success: true, message: 'Device removed' });
  } catch (error) {
    console.error('Device remove error:', error);
    return NextResponse.json({ error: 'Failed to remove device' }, { status: 500 });
  }
}
