import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Query Convex for real security statistics
    const [
      totalEventsResponse,
      criticalEventsResponse,
      blockedIPsResponse,
      bannedHardwareResponse,
      activeThreatsResponse
    ] = await Promise.all([
      // Total security events in last 24 hours
      fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'security.getEventCount',
          args: { hours: 24 }
        })
      }),
      
      // Critical events in last 24 hours
      fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'security.getCriticalEventCount',
          args: { hours: 24 }
        })
      }),
      
      // Total blocked IPs
      fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'security.getBlockedIPCount',
          args: {}
        })
      }),
      
      // Total banned hardware fingerprints
      fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'security.getBannedHardwareCount',
          args: {}
        })
      }),
      
      // Active threats (high/critical events in last hour)
      fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'security.getActiveThreatsCount',
          args: { hours: 1 }
        })
      })
    ]);

    const [
      totalEvents,
      criticalEvents,
      blockedIPs,
      bannedHardware,
      activeThreats
    ] = await Promise.all([
      totalEventsResponse.json(),
      criticalEventsResponse.json(),
      blockedIPsResponse.json(),
      bannedHardwareResponse.json(),
      activeThreatsResponse.json()
    ]);

    const stats = {
      totalEvents: totalEvents.count || 0,
      criticalEvents: criticalEvents.count || 0,
      blockedIPs: blockedIPs.count || 0,
      bannedHardware: bannedHardware.count || 0,
      activeThreats: activeThreats.count || 0
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to load security stats:', error);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
