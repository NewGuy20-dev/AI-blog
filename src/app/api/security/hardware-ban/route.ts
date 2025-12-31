import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from "../../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { ip, reason, hardwareBan = true, masterKey } = await request.json();

    // Validate master key for banning
    const valid = await convex.query(api.admin.validateMasterKey, { key: masterKey || "" });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid master key' }, { status: 403 });
    }

    await convex.mutation('security:blockIP' as any, {
      ip,
      reason,
      blockedBy: 'admin',
      permanent: true
    });

    let fingerprintsBanned = 0;

    if (hardwareBan) {
      const fingerprints = await convex.query('security:getFingerprintsByIP' as any, { ip });
      
      for (const fingerprint of fingerprints) {
        await convex.mutation('security:banHardwareFingerprint' as any, {
          fingerprint: fingerprint.serverFingerprint || fingerprint.visitorId,
          canvasFingerprint: fingerprint.canvasFingerprint,
          webglFingerprint: fingerprint.webglFingerprint,
          audioFingerprint: fingerprint.audioFingerprint,
          screenMetrics: fingerprint.screenMetrics,
          reason: `Hardware ban - associated with blocked IP ${ip}`,
          bannedAt: Date.now()
        });
      }

      await convex.mutation('security:blockSimilarHardware' as any, {
        ip,
        reason: 'Similar hardware signature to banned device'
      });

      fingerprintsBanned = fingerprints.length;
    }

    return NextResponse.json({ 
      success: true, 
      message: `IP ${ip} and associated hardware fingerprints banned`,
      fingerprintsBanned
    });
  } catch (error) {
    return NextResponse.json({ error: 'Hardware ban failed' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const bannedHardware = await convex.query('security:getBannedHardware' as any, {});
    
    return NextResponse.json({
      totalBanned: bannedHardware.length,
      bannedDevices: bannedHardware.map((hw: any) => ({
        fingerprint: hw.fingerprint,
        reason: hw.reason,
        bannedAt: hw.bannedAt,
        lastSeen: hw.lastSeen
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get banned hardware' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { fingerprint, masterKey } = await request.json();
    
    // Validate master key for unbanning
    const valid = await convex.query(api.admin.validateMasterKey, { key: masterKey || "" });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid master key' }, { status: 403 });
    }
    
    await convex.mutation('security:unbanHardware' as any, { fingerprint });
    
    return NextResponse.json({ success: true, message: `Unbanned ${fingerprint}` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to unban hardware' }, { status: 500 });
  }
}
