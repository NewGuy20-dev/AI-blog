'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  ip: string;
  timestamp: number;
  blocked: boolean;
  details: any;
}

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  blockedIPs: number;
  bannedHardware: number;
  activeThreats: number;
}

interface LockdownStatus {
  active: boolean;
  reason?: string;
  activatedAt?: number;
  activatedBy?: string;
}

interface AuthorizedDevice {
  name: string;
  fingerprint: string;
  addedAt: number;
}

export default function AdminSecurityDashboard() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [stats, setStats] = useState<SecurityStats>({
    totalEvents: 0,
    criticalEvents: 0,
    blockedIPs: 0,
    bannedHardware: 0,
    activeThreats: 0
  });
  const [lockdownStatus, setLockdownStatus] = useState<LockdownStatus>({ active: false });
  const [authorizedDevice, setAuthorizedDevice] = useState<AuthorizedDevice | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSecurityData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSecurityData = async () => {
    try {
      const eventsResponse = await fetch('/api/security/events');
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData.events || []);
      }

      const statsResponse = await fetch('/api/security/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      const lockdownResponse = await fetch('/api/security/lockdown-status');
      if (lockdownResponse.ok) {
        const lockdownData = await lockdownResponse.json();
        setLockdownStatus(lockdownData);
      } else {
        setLockdownStatus({ active: false });
      }

      const deviceResponse = await fetch('/api/security/authorized-device');
      if (deviceResponse.ok) {
        const deviceData = await deviceResponse.json();
        setAuthorizedDevice(deviceData.device || null);
      } else {
        setAuthorizedDevice(null);
      }
    } catch (error) {
      console.error('Failed to load security data:', error);
      setLockdownStatus({ active: false });
      setAuthorizedDevice(null);
    }
  };

  const handleBlockIP = async (ip: string) => {
    if (confirm(`Block IP ${ip} permanently?`)) {
      await fetch('/api/security/hardware-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason: 'Manual admin block', hardwareBan: true })
      });
      loadSecurityData();
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">🛡️ Security Dashboard</h1>
        <button
          onClick={() => setAutoRefresh(!autoRefresh)}
          className={`px-4 py-2 rounded ${autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
        >
          {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
        </button>
      </div>

      {/* Lockdown Status Banner */}
      {lockdownStatus.active && (
        <Card className="border-red-600 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🚨</span>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-red-800">EMERGENCY LOCKDOWN ACTIVE</h2>
                <p className="text-red-700">Reason: {lockdownStatus.reason}</p>
                <p className="text-sm text-red-600">
                  Activated: {lockdownStatus.activatedAt ? new Date(lockdownStatus.activatedAt).toLocaleString() : 'Unknown'}
                  {' by '}{lockdownStatus.activatedBy || 'system'}
                </p>
                <p className="text-sm text-red-700 mt-2">
                  To deactivate: <code className="bg-red-100 px-1 rounded">npm run lockdown:toggle off</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SSH-Only Lockdown Info */}
      <Card className="border-yellow-400 bg-yellow-50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-yellow-900 mb-2">🔐 SSH-Only Lockdown Control</h3>
          <p className="text-sm text-yellow-800 mb-3">
            Emergency lockdown can only be toggled via SSH authentication from the authorized device.
            This ensures maximum security - even if the web application is compromised, lockdown cannot be manipulated.
          </p>
          <div className="bg-yellow-100 p-3 rounded text-xs font-mono space-y-1">
            <div>npm run lockdown:toggle on  <span className="text-yellow-700"># Activate lockdown</span></div>
            <div>npm run lockdown:toggle off <span className="text-yellow-700"># Deactivate lockdown</span></div>
            <div>npm run lockdown:register   <span className="text-yellow-700"># Register SSH device</span></div>
            <div>npm run lockdown:remove     <span className="text-yellow-700"># Remove device (requires SSH + master key)</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Authorized Device */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 Authorized SSH Device</CardTitle>
        </CardHeader>
        <CardContent>
          {authorizedDevice ? (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Device Name:</span>
                <span className="font-medium">{authorizedDevice.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Key Fingerprint:</span>
                <span className="font-mono text-xs">{authorizedDevice.fingerprint}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registered:</span>
                <span>{new Date(authorizedDevice.addedAt).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No device registered. Run <code className="bg-gray-100 px-1 rounded">npm run lockdown:register</code> to register.</p>
          )}
        </CardContent>
      </Card>

      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Total Events</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.totalEvents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">Critical Events</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Blocked IPs</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.blockedIPs}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Banned Hardware</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats.bannedHardware}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-orange-600">Active Threats</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-600">{stats.activeThreats}</div></CardContent>
        </Card>
      </div>

      {/* Real-time Security Events */}
      <Card>
        <CardHeader><CardTitle>🚨 Real-time Security Events</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500">No recent security events</p>
            ) : (
              events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                      <span className="font-medium">{event.eventType}</span>
                      {event.blocked && <span className="text-red-600">🚫 BLOCKED</span>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      IP: {event.ip} | User: {event.userId || 'Unknown'} | {new Date(event.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleBlockIP(event.ip)}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                  >
                    Block IP
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>🔧 System Status</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between"><span>JWT Blacklisting</span><span className="text-green-600">✅ Active</span></div>
              <div className="flex justify-between"><span>VPN Detection</span><span className="text-green-600">✅ Active</span></div>
              <div className="flex justify-between"><span>Hardware Fingerprinting</span><span className="text-green-600">✅ Active</span></div>
              <div className="flex justify-between"><span>SSH-Only Lockdown</span><span className="text-green-600">✅ Enforced</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>⚙️ Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button onClick={() => fetch('/api/security/clear-cache', { method: 'POST' })} className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
                🧹 Clear Security Cache
              </button>
              <button onClick={() => fetch('/api/security/test-discord', { method: 'POST' })} className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                📢 Test Discord Alert
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
