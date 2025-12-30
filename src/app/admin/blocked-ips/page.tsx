"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ShieldBan, Trash2, Plus, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";

export default function BlockedIpsPage() {
  const blockedIps = useQuery(api.blockedIps.listBlocked);
  const blockIp = useMutation(api.blockedIps.blockIp);
  const unblockIp = useMutation(api.blockedIps.unblockIp);

  const [newIp, setNewIp] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number | undefined>();
  const [myIp, setMyIp] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/check-ip').then(res => res.json()).then(data => setMyIp(data.ip)).catch(() => {});
  }, []);

  const handleBlock = async () => {
    if (!newIp.trim()) return;
    await blockIp({ ip: newIp.trim(), reason: reason || undefined, durationDays: duration });
    setNewIp("");
    setReason("");
    setDuration(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <ShieldBan className="text-red-400" />
          Blocked IPs
        </h1>
        <p className="text-white/50 text-sm">Manage blocked IP addresses</p>
      </div>

      {/* Current IP Info */}
      {myIp && (
        <GlassCard variant="purple" padding="sm">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-violet-400" />
            <span className="text-sm">Your current IP: <code className="font-mono bg-violet-500/20 px-2 py-0.5 rounded">{myIp}</code></span>
          </div>
        </GlassCard>
      )}

      {/* Add new IP */}
      <GlassCard>
        <h2 className="text-sm font-medium text-white/60 mb-4">Block New IP</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="IP Address (e.g., 192.168.1.1)"
            className="glass-input flex-1 min-w-[200px] px-3 py-2"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="glass-input flex-1 min-w-[150px] px-3 py-2"
          />
          <select
            value={duration || ""}
            onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : undefined)}
            className="glass-input px-3 py-2"
          >
            <option value="">Permanent</option>
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
          </select>
          <GlassButton variant="danger" onClick={handleBlock}>
            <Plus size={16} className="mr-1" />
            Block
          </GlassButton>
        </div>
      </GlassCard>

      {/* List */}
      <GlassCard padding="sm">
        {!blockedIps ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : blockedIps.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <ShieldBan size={48} className="mx-auto mb-4 opacity-50" />
            <p>No blocked IPs</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {blockedIps.map((item: any) => (
              <div key={item._id} className="py-4 px-2 flex items-center justify-between">
                <div>
                  <p className="font-mono font-medium">{item.ip}</p>
                  <p className="text-xs text-white/40 mt-1">
                    Blocked {formatDistanceToNow(item.blockedAt, { addSuffix: true })}
                    {item.expiresAt && ` · Expires ${formatDistanceToNow(item.expiresAt, { addSuffix: true })}`}
                  </p>
                  {item.reason && <p className="text-xs text-white/50 mt-1">Reason: {item.reason}</p>}
                </div>
                <GlassButton variant="secondary" size="sm" onClick={() => unblockIp({ ip: item.ip })}>
                  <Trash2 size={14} />
                </GlassButton>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
