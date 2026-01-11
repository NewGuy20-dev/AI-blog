import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import * as sshpk from 'sshpk';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { challenge, signature, newDevice } = body;

    if (!challenge || !signature || !newDevice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate newDevice fields
    if (!newDevice.name || typeof newDevice.name !== 'string' || !newDevice.name.trim()) {
      return NextResponse.json({ error: 'Invalid device name' }, { status: 400 });
    }
    if (!newDevice.publicKey || typeof newDevice.publicKey !== 'string') {
      return NextResponse.json({ error: 'Invalid public key' }, { status: 400 });
    }
    if (!newDevice.keyType || !['rsa', 'dsa', 'ecdsa', 'ed25519'].includes(newDevice.keyType)) {
      return NextResponse.json({ error: 'Invalid key type' }, { status: 400 });
    }
    if (!newDevice.fingerprint || typeof newDevice.fingerprint !== 'string') {
      return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 });
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

    // Atomic challenge validation (same as lockdown-toggle)
    const challengeResult = await convex.mutation(api.security.useAndValidateChallenge, { challenge });
    if (!challengeResult.valid) {
      return NextResponse.json({ error: challengeResult.error || 'Invalid or expired challenge' }, { status: 403 });
    }

    // Replace device
    await convex.mutation(api.security.replaceAuthorizedDevice, {
      oldDeviceId: existingDevice._id,
      name: newDevice.name.trim(),
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
