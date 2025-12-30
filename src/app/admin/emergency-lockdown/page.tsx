"use client";

import { useState } from "react";
import { AlertTriangle, Shield, ShieldOff, Clock } from "lucide-react";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";

export default function EmergencyLockdownPage() {
  const [isLocked, setIsLocked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (confirmText !== "LOCKDOWN") return;
    setLoading(true);
    try {
      await fetch("/api/security/emergency-lockdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manual emergency lockdown from admin panel" }),
      });
      setIsLocked(true);
      setShowConfirm(false);
      setConfirmText("");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate emergency lockdown?")) return;
    setLoading(true);
    // In production, call deactivate endpoint
    setIsLocked(false);
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <AlertTriangle className="text-red-400" />
          Emergency Lockdown
        </h1>
        <p className="text-white/50 text-sm">Control system-wide emergency lockdown</p>
      </div>

      {/* Status Card */}
      <GlassCard variant={isLocked ? "danger" : "success"} className="text-center py-12">
        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6 ${isLocked ? "bg-red-500/20" : "bg-green-500/20"}`}>
          {isLocked ? <ShieldOff size={48} className="text-red-400" /> : <Shield size={48} className="text-green-400" />}
        </div>
        <h2 className="text-3xl font-bold mb-2">{isLocked ? "LOCKDOWN ACTIVE" : "SYSTEM NORMAL"}</h2>
        <p className="text-white/60">{isLocked ? "All non-trusted access is blocked" : "System is operating normally"}</p>
      </GlassCard>

      {/* Actions */}
      {!isLocked ? (
        <GlassCard>
          <h3 className="font-semibold mb-4">Activate Emergency Lockdown</h3>
          {!showConfirm ? (
            <div>
              <p className="text-white/60 text-sm mb-4">This will immediately:</p>
              <ul className="text-sm text-white/60 space-y-2 mb-6">
                <li>• Block all non-trusted device access</li>
                <li>• Blacklist all active non-admin sessions</li>
                <li>• Enable maximum rate limiting</li>
                <li>• Send critical Discord alert</li>
              </ul>
              <GlassButton variant="danger" onClick={() => setShowConfirm(true)}>
                <AlertTriangle size={16} className="mr-2" />
                Initiate Lockdown
              </GlassButton>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-red-400 font-medium">Type "LOCKDOWN" to confirm:</p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type LOCKDOWN"
                className="glass-input w-full px-4 py-3 text-center text-lg font-mono"
              />
              <div className="flex gap-3">
                <GlassButton variant="secondary" onClick={() => { setShowConfirm(false); setConfirmText(""); }}>Cancel</GlassButton>
                <GlassButton variant="danger" onClick={handleActivate} disabled={confirmText !== "LOCKDOWN" || loading}>
                  {loading ? "Activating..." : "Confirm Lockdown"}
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>
      ) : (
        <GlassCard>
          <h3 className="font-semibold mb-4">Deactivate Lockdown</h3>
          <p className="text-white/60 text-sm mb-4">This will restore normal system operation and allow access again.</p>
          <GlassButton onClick={handleDeactivate} disabled={loading}>
            {loading ? "Deactivating..." : "Deactivate Lockdown"}
          </GlassButton>
        </GlassCard>
      )}

      {/* Info */}
      <GlassCard padding="sm">
        <div className="flex items-start gap-3">
          <Clock size={18} className="text-violet-400 mt-0.5" />
          <div className="text-sm text-white/60">
            <p className="font-medium text-white mb-1">When to use Emergency Lockdown</p>
            <p>Use this feature when you detect an active security breach, suspicious admin access attempts, or need to immediately secure the system while investigating an incident.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
