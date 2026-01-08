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
  const [masterKey, setMasterKey] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadSecurityData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSecurityData = async () => {
    try {
      // Load recent security events
      const eventsResponse = await fetch('/api/security/events');
      const eventsData = await eventsResponse.json();
      setEvents(eventsData.events || []);

      // Load security statistics
      const statsResponse = await fetch('/api/security/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Load lockdown status
      const lockdownResponse = await fetch('/api/security/lockdown-status');
      const lockdownData = await lockdownResponse.json();
      setLockdownStatus(lockdownData);
    } catch (error) {
      console.error('Failed to load security data:', error);
    }
  };

  const handleEmergencyLockdown = async () => {
    const key = prompt('Enter master key to activate emergency lockdown:');
    if (!key) return;

    const reason = prompt('Reason for lockdown:') || 'Manual emergency lockdown';
    
    try {
      const response = await fetch('/api/security/emergency-lockdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, masterKey: key })
      });
      
      const result = await response.json();
      if (result.success) {
        alert('✅ Emergency lockdown activated!');
        loadSecurityData();
      } else {
        alert('❌ ' + (result.error || 'Failed to activate lockdown'));
      }
    } catch (error) {
      alert('❌ Failed to activate lockdown');
    }
  };

  const handleBlockIP = async (ip: string) => {
    if (confirm(`Block IP ${ip} permanently?`)) {
      await fetch('/api/security/hardware-ban', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ip, 
          reason: 'Manual admin block',
          hardwareBan: true 
        })
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
        <div className="flex gap-4">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded ${autoRefresh ? 'bg-green-500 text-white' : 'bg-gray-300'}`}
          >
            {autoRefresh ? '🔄 Auto-Refresh ON' : '⏸️ Auto-Refresh OFF'}
          </button>
          <button
            onClick={handleEmergencyLockdown}
            className={`px-4 py-2 rounded font-bold ${lockdownStatus.active ? 'bg-red-800 text-white' : 'bg-red-600 text-white hover:bg-red-700'}`}
          >
            {lockdownStatus.active ? '🔒 LOCKDOWN ACTIVE' : '🚨 Emergency Lockdown'}
          </button>
        </div>
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-600">Critical Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Blocked IPs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blockedIPs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Banned Hardware</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bannedHardware}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-600">Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.activeThreats}</div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>🚨 Real-time Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500">No recent security events</p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {event.severity.toUpperCase()}
                      </span>
                      <span className="font-medium">{event.eventType}</span>
                      {event.blocked && <span className="text-red-600">🚫 BLOCKED</span>}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      IP: {event.ip} | User: {event.userId || 'Unknown'} | 
                      {new Date(event.timestamp).toLocaleString()}
                    </div>
                    {event.details && (
                      <div className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(event.details).substring(0, 200)}...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBlockIP(event.ip)}
                      className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
                    >
                      Block IP
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>🔧 System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>JWT Blacklisting</span>
                <span className="text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between">
                <span>VPN Detection</span>
                <span className="text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between">
                <span>Hardware Fingerprinting</span>
                <span className="text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between">
                <span>Mouse Tracking</span>
                <span className="text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between">
                <span>Auto-Response</span>
                <span className="text-green-600">✅ Active</span>
              </div>
              <div className="flex justify-between">
                <span>Discord Alerts</span>
                <span className="text-green-600">✅ Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⚙️ Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button 
                onClick={() => fetch('/api/security/rotate-keys', { method: 'POST' })}
                className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                🔄 Rotate JWT Keys
              </button>
              <button 
                onClick={() => fetch('/api/security/clear-cache', { method: 'POST' })}
                className="w-full p-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                🧹 Clear Security Cache
              </button>
              <button 
                onClick={() => fetch('/api/security/test-discord', { method: 'POST' })}
                className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                📢 Test Discord Alert
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
