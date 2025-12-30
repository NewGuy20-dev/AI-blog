"use client";

import { useState, useEffect } from "react";
import { Ban, Plus, Trash2, Monitor } from "lucide-react";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";
import { formatDistanceToNow } from "date-fns";

interface BannedHardware {
  fingerprint: string;
  canvasFingerprint?: string;
  webglFingerprint?: string;
  audioFingerprint?: string;
  reason: string;
  bannedAt: number;
}

export default function HardwareBansPage() {
  const [bans, setBans] = useState<BannedHardware[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newBan, setNewBan] = useState({ ip: "", reason: "" });

  useEffect(() => {
    loadBans();
  }, []);

  const loadBans = async () => {
    try {
      const res = await fetch("/api/security/hardware-ban");
      const data = await res.json();
      setBans(data.bannedDevices || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBan = async () => {
    if (!newBan.ip.trim()) return;
    await fetch("/api/security/hardware-ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip: newBan.ip, reason: newBan.reason || "Manual ban", hardwareBan: true }),
    });
    setNewBan({ ip: "", reason: "" });
    setShowForm(false);
    loadBans();
  };

  const handleUnban = async (fingerprint: string) => {
    if (!confirm(`Unban hardware fingerprint ${fingerprint.slice(0, 20)}...?`)) return;
    await fetch("/api/security/hardware-ban", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
    });
    loadBans();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Ban className="text-red-400" />
            Hardware Bans
          </h1>
          <p className="text-white/50 text-sm">Manage banned hardware fingerprints</p>
        </div>
        <GlassButton onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-2" />
          Ban Hardware
        </GlassButton>
      </div>

      {/* Add Ban Form */}
      {showForm && (
        <GlassCard>
          <h3 className="font-semibold mb-4">Ban Hardware by IP</h3>
          <p className="text-white/50 text-sm mb-4">This will ban all hardware fingerprints associated with the IP address.</p>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="IP Address"
              value={newBan.ip}
              onChange={(e) => setNewBan({ ...newBan, ip: e.target.value })}
              className="glass-input w-full px-4 py-2"
            />
            <input
              type="text"
              placeholder="Reason (optional)"
              value={newBan.reason}
              onChange={(e) => setNewBan({ ...newBan, reason: e.target.value })}
              className="glass-input w-full px-4 py-2"
            />
            <div className="flex gap-3">
              <GlassButton variant="secondary" onClick={() => setShowForm(false)}>Cancel</GlassButton>
              <GlassButton variant="danger" onClick={handleBan}>Ban Hardware</GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Bans List */}
      <GlassCard padding="sm">
        {loading ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : bans.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Monitor size={48} className="mx-auto mb-4 opacity-50" />
            <p>No hardware bans</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {bans.map((ban, i) => (
              <div key={i} className="py-4 px-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="font-mono text-sm text-violet-400">{ban.fingerprint}</p>
                    <p className="text-sm text-white/60">{ban.reason}</p>
                    <p className="text-xs text-white/40">Banned {formatDistanceToNow(ban.bannedAt, { addSuffix: true })}</p>
                    {(ban.canvasFingerprint || ban.webglFingerprint) && (
                      <div className="text-xs text-white/30 space-y-1 mt-2">
                        {ban.canvasFingerprint && <p>Canvas: {ban.canvasFingerprint.slice(0, 30)}...</p>}
                        {ban.webglFingerprint && <p>WebGL: {ban.webglFingerprint.slice(0, 30)}...</p>}
                      </div>
                    )}
                  </div>
                  <GlassButton variant="secondary" size="sm" onClick={() => handleUnban(ban.fingerprint)}>
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
