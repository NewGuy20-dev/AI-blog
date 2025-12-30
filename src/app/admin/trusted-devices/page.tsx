"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Plus, Trash2, Smartphone, Shield } from "lucide-react";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";
import { formatDistanceToNow } from "date-fns";

interface TrustedDevice {
  fingerprint: string;
  ip: string;
  userAgent: string;
  timezone: string;
  trustedAt: number;
}

export default function TrustedDevicesPage() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDevice, setNewDevice] = useState({ fingerprint: "", ip: "" });
  const [currentDevice, setCurrentDevice] = useState<{ ip: string; fingerprint: string } | null>(null);
  const [trusting, setTrusting] = useState(false);

  useEffect(() => {
    loadDevices();
    loadCurrentDevice();
  }, []);

  const loadDevices = async () => {
    try {
      const res = await fetch("/api/security/whitelist");
      const data = await res.json();
      setDevices(data.devices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentDevice = async () => {
    try {
      // Get current IP
      const ipRes = await fetch("/api/check-ip");
      const ipData = await ipRes.json();
      
      // Get fingerprint using FingerprintJS
      const FingerprintJS = (await import("@fingerprintjs/fingerprintjs")).default;
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const fingerprint = result.visitorId;
      
      setCurrentDevice({ 
        ip: ipData.ip === "::1" ? "127.0.0.1 (localhost)" : ipData.ip || "Unknown", 
        fingerprint 
      });
    } catch (e) {
      console.error(e);
      setCurrentDevice({ ip: "Error loading", fingerprint: "Error loading" });
    }
  };

  const handleTrustCurrentDevice = async () => {
    if (!currentDevice) return;
    setTrusting(true);
    try {
      await fetch("/api/security/whitelist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fingerprint: currentDevice.fingerprint,
          ip: currentDevice.ip,
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      loadDevices();
    } catch (e) {
      console.error(e);
    } finally {
      setTrusting(false);
    }
  };

  const handleAdd = async () => {
    if (!newDevice.fingerprint.trim() && !newDevice.ip.trim()) return;
    await fetch("/api/security/whitelist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fingerprint: newDevice.fingerprint,
        ip: newDevice.ip,
        userAgent: "Manual add",
        timezone: "UTC",
      }),
    });
    setNewDevice({ fingerprint: "", ip: "" });
    setShowForm(false);
    loadDevices();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <CheckCircle className="text-green-400" />
            Trusted Devices
          </h1>
          <p className="text-white/50 text-sm">Manage trusted admin devices</p>
        </div>
        <GlassButton onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Add Manually
        </GlassButton>
      </div>

      {/* Trust Current Device */}
      <GlassCard variant="success">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2">
              <Shield size={18} className="text-green-400" />
              Trust This Device
            </h3>
            <div className="text-sm text-white/60 mt-2 space-y-1">
              <p>IP: <span className="font-mono">{currentDevice?.ip || "Loading..."}</span></p>
              <p>Fingerprint: <span className="font-mono text-xs">{currentDevice?.fingerprint || "Loading..."}</span></p>
            </div>
          </div>
          <GlassButton onClick={handleTrustCurrentDevice} disabled={!currentDevice || trusting}>
            {trusting ? "Trusting..." : "Trust This Device"}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Add Device Form */}
      {showForm && (
        <GlassCard>
          <h3 className="font-semibold mb-4">Add Trusted Device Manually</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Fingerprint"
              value={newDevice.fingerprint}
              onChange={(e) => setNewDevice({ ...newDevice, fingerprint: e.target.value })}
              className="glass-input w-full px-4 py-2"
            />
            <input
              type="text"
              placeholder="IP Address"
              value={newDevice.ip}
              onChange={(e) => setNewDevice({ ...newDevice, ip: e.target.value })}
              className="glass-input w-full px-4 py-2"
            />
            <div className="flex gap-3">
              <GlassButton variant="secondary" onClick={() => setShowForm(false)}>Cancel</GlassButton>
              <GlassButton onClick={handleAdd}>Add Device</GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Devices List */}
      <GlassCard padding="sm">
        <h3 className="font-semibold px-2 py-3 border-b border-white/10">Trusted Devices List</h3>
        {loading ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Smartphone size={48} className="mx-auto mb-4 opacity-50" />
            <p>No trusted devices yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {devices.map((device, i) => (
              <div key={i} className="py-4 px-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="font-mono text-sm text-green-400">{device.fingerprint || "No fingerprint"}</p>
                    <div className="text-sm text-white/60 space-y-1">
                      <p>IP: <span className="font-mono">{device.ip}</span></p>
                      <p>Timezone: {device.timezone}</p>
                    </div>
                    <p className="text-xs text-white/40">Trusted {formatDistanceToNow(device.trustedAt, { addSuffix: true })}</p>
                    {device.userAgent && device.userAgent !== "Manual add" && (
                      <p className="text-xs text-white/30 truncate max-w-md">{device.userAgent}</p>
                    )}
                  </div>
                  <GlassButton variant="danger" size="sm">
                    <Trash2 size={14} />
                  </GlassButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
