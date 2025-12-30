import { NextRequest, NextResponse } from 'next/server';

// Mock data - replace with actual Convex queries
export async function GET(request: NextRequest) {
  try {
    // In real implementation, query Convex for recent security events
    const mockEvents = [
      {
        id: '1',
        eventType: 'vpn_detected',
        severity: 'high' as const,
        userId: 'unknown',
        ip: '192.168.1.100',
        timestamp: Date.now() - 300000,
        blocked: true,
        details: { vpnProvider: 'NordVPN', riskScore: 85 }
      },
      {
        id: '2',
        eventType: 'suspicious_mouse_behavior',
        severity: 'medium' as const,
        userId: 'user123',
        ip: '10.0.0.1',
        timestamp: Date.now() - 600000,
        blocked: false,
        details: { indicators: ['straight_line_movements', 'inhuman_speed'] }
      },
      {
        id: '3',
        eventType: 'admin_access_attempt',
        severity: 'critical' as const,
        userId: 'hacker123',
        ip: '203.0.113.1',
        timestamp: Date.now() - 900000,
        blocked: true,
        details: { attemptedRoute: '/admin', spoofedFingerprint: true }
      }
    ];

    return NextResponse.json({ events: mockEvents });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load events' }, { status: 500 });
  }
}
