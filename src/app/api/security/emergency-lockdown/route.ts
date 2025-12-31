import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL!;
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { reason, masterKey } = await request.json();
    
    // Validate master key
    const keyDoc = await convex.query(api.admin.getMasterKey, {});
    if (!keyDoc || keyDoc !== masterKey) {
      return NextResponse.json({ error: 'Invalid master key' }, { status: 403 });
    }
    
    // Activate emergency lockdown
    await activateEmergencyLockdown(reason || 'Manual emergency lockdown');
    
    // Send critical Discord alert
    await sendEmergencyAlert(reason);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Emergency lockdown activated',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: 'Emergency lockdown failed' }, { status: 500 });
  }
}

async function activateEmergencyLockdown(reason: string) {
  try {
    // 1. Set global security flag in database
    await fetch('/api/convex/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'security.setEmergencyLockdown',
        args: { active: true, reason, timestamp: Date.now() }
      })
    });

    // 2. Blacklist all non-admin tokens
    await fetch('/api/convex/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'security.blacklistAllNonAdminTokens',
        args: { reason: `Emergency lockdown: ${reason}` }
      })
    });

    // 3. Enable maximum rate limiting for all IPs
    await fetch('/api/convex/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'security.enableMaximumRateLimit',
        args: { reason }
      })
    });

    // 4. Log emergency lockdown event
    await fetch('/api/convex/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        function: 'security.logSecurityEvent',
        args: {
          userId: 'system',
          ip: 'system',
          userAgent: 'emergency-system',
          eventType: 'emergency_lockdown_activated',
          severity: 'critical',
          details: { reason, lockdownLevel: 'maximum' },
          timestamp: Date.now(),
          blocked: false,
          action: 'emergency_lockdown'
        }
      })
    });

    console.log('EMERGENCY LOCKDOWN ACTIVATED:', reason);
  } catch (error) {
    console.error('Emergency lockdown failed:', error);
    throw error;
  }
}

async function sendEmergencyAlert(reason: string) {
  const embed = {
    title: '🚨 EMERGENCY LOCKDOWN ACTIVATED',
    color: 0xFF0000,
    fields: [
      { name: '⚠️ Status', value: 'SYSTEM LOCKED DOWN', inline: true },
      { name: '🕐 Time', value: new Date().toLocaleString(), inline: true },
      { name: '📝 Reason', value: reason, inline: false },
      { name: '🔒 Actions Taken', value: '• All non-trusted access blocked\n• Maximum security enabled\n• All activities logged', inline: false }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Pageo Security System - EMERGENCY' }
  };

  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed],
      content: '@everyone 🚨 **EMERGENCY LOCKDOWN ACTIVATED** 🚨'
    })
  });
}
