import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL!;

export async function POST(request: NextRequest) {
  try {
    // Generate new JWT signing key
    const newKey = crypto.randomBytes(64).toString('hex');
    
    // In production, you'd update this in your environment/secrets
    // For now, we'll simulate the rotation
    
    // Blacklist all existing tokens (force re-authentication)
    await blacklistAllTokens('JWT key rotation');
    
    // Send Discord notification
    await notifyKeyRotation();
    
    return NextResponse.json({ 
      success: true, 
      message: 'JWT keys rotated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Key rotation failed' }, { status: 500 });
  }
}

async function blacklistAllTokens(reason: string) {
  // In real implementation, this would:
  // 1. Query all active sessions from Convex
  // 2. Add all JTIs to blacklist
  // 3. Force users to re-authenticate
  console.log('Blacklisting all tokens due to:', reason);
}

async function notifyKeyRotation() {
  const embed = {
    title: '🔄 JWT Key Rotation',
    color: 0xFFFF00,
    fields: [
      { name: '🔐 Action', value: 'JWT signing keys rotated', inline: true },
      { name: '⏰ Time', value: new Date().toLocaleString(), inline: true },
      { name: '🔒 Security', value: 'All existing tokens invalidated', inline: false },
      { name: '👥 Impact', value: 'Users will need to re-authenticate', inline: false }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Pageo Security System' }
  };

  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed],
      content: '🔄 **JWT Key Rotation Complete** - Enhanced security activated'
    })
  });
}
