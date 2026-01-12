import { NextRequest, NextResponse } from 'next/server';

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL!;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID!;

export async function POST(request: NextRequest) {
  try {
    const { 
      eventType, 
      severity, 
      userId, 
      ip, 
      userAgent,
      details 
    } = await request.json();

    // Auto-response based on threat level
    const response = await autoRespond(eventType, severity, userId, ip, details);
    
    // Send Discord alert for critical/high severity events
    if (severity === 'critical' || severity === 'high') {
      await sendDiscordAlert({
        eventType,
        severity,
        userId,
        ip,
        userAgent,
        details,
        autoAction: response.action
      });
    }

    return NextResponse.json({ 
      success: true, 
      autoAction: response.action,
      blocked: response.blocked 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Auto-response failed' }, { status: 500 });
  }
}

async function autoRespond(eventType: string, severity: string, userId: string, ip: string, details: any) {
  let action = 'logged';
  let blocked = false;

  // CRITICAL: Immediate lockdown
  if (severity === 'critical') {
    if (userId === ADMIN_USER_ID) {
      // Lock admin account immediately
      await fetch('/api/security/admin-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reason: `Critical threat detected: ${eventType}`,
          emergencyKey: process.env.EMERGENCY_LOCKDOWN_KEY 
        })
      });
      action = 'admin_locked';
      blocked = true;
    }
    
    // Block IP permanently
    await fetch('/api/security/hardware-ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ip, 
        reason: `Critical threat: ${eventType}`,
        hardwareBan: true 
      })
    });
    action += '_ip_banned';
    blocked = true;
  }

  // HIGH: Temporary restrictions
  else if (severity === 'high') {
    // Rate limit aggressively
    await applyDynamicRateLimit(ip, 'high');
    
    // Require progressive challenges
    await triggerSecurityChallenge(userId, ip, 'captcha');
    
    action = 'rate_limited_challenge_required';
  }

  // MEDIUM: Enhanced monitoring
  else if (severity === 'medium') {
    await applyDynamicRateLimit(ip, 'medium');
    action = 'enhanced_monitoring';
  }

  return { action, blocked };
}

async function sendDiscordAlert(alert: any) {
  const embed = {
    title: `🚨 Security Alert - ${alert.severity.toUpperCase()}`,
    color: alert.severity === 'critical' ? 0xFF0000 : 0xFF8C00,
    fields: [
      { name: '🎯 Event', value: alert.eventType, inline: true },
      { name: '👤 User ID', value: alert.userId || 'Unknown', inline: true },
      { name: '🌐 IP Address', value: alert.ip, inline: true },
      { name: '🔧 Auto Action', value: alert.autoAction, inline: true },
      { name: '📱 User Agent', value: alert.userAgent.substring(0, 100), inline: false },
      { name: '📊 Details', value: JSON.stringify(alert.details).substring(0, 500), inline: false }
    ],
    timestamp: new Date().toISOString(),
    footer: { text: 'Pageo Security System' }
  };

  await fetch(DISCORD_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [embed],
      content: alert.severity === 'critical' ? '@everyone CRITICAL SECURITY ALERT' : null
    })
  });
}

async function applyDynamicRateLimit(ip: string, level: string) {
  const limits = {
    high: { requests: 5, window: 300 }, // 5 requests per 5 minutes
    medium: { requests: 20, window: 300 }, // 20 requests per 5 minutes
    low: { requests: 100, window: 300 } // 100 requests per 5 minutes
  };
  
  // Implementation would store rate limits in Redis/database
}

async function triggerSecurityChallenge(userId: string, ip: string, type: string) {
  // Store challenge requirement in database
}
