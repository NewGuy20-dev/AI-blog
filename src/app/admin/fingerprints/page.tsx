"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Fingerprint, Ban, Check, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";

export default function FingerprintsPage() {
  const [bannedOnly, setBannedOnly] = useState(false);
  const [searchUserId, setSearchUserId] = useState("");
  
  const fingerprints = useQuery(api.fingerprints.list, { bannedOnly });
  const userFingerprints = useQuery(api.fingerprints.getByUserId, searchUserId ? { userId: searchUserId } : "skip");
  const ban = useMutation(api.fingerprints.ban);
  const unban = useMutation(api.fingerprints.unban);

  const displayList = searchUserId && userFingerprints ? userFingerprints : fingerprints;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Fingerprint className="text-violet-400" />
          Browser Fingerprints
        </h1>
        <p className="text-white/50 text-sm">View and manage browser fingerprints</p>
      </div>

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-white/40" />
            <input
              type="text"
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              placeholder="Search by User ID..."
              className="glass-input flex-1 px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-white/60">
            <input
              type="checkbox"
              checked={bannedOnly}
              onChange={(e) => setBannedOnly(e.target.checked)}
              className="rounded bg-white/10 border-white/20"
            />
            Banned only
          </label>
        </div>
      </GlassCard>

      {/* List */}
      <GlassCard padding="sm">
        {!displayList ? (
          <div className="text-center py-12 text-white/50">Loading...</div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Fingerprint size={48} className="mx-auto mb-4 opacity-50" />
            <p>No fingerprints found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {displayList.map((fp: any) => (
              <div key={fp._id} className={`py-4 px-2 ${fp.banned ? 'border-l-2 border-red-500 pl-4' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <code className="text-sm font-mono text-violet-400">{fp.visitorId}</code>
                      {fp.banned && <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">BANNED</span>}
                      {fp.restricted && <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">RESTRICTED</span>}
                      {fp.riskScore !== undefined && (
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          fp.riskScore >= 8 ? 'bg-red-500/20 text-red-400' :
                          fp.riskScore >= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                          fp.riskScore >= 3 ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                        }`}>Risk: {fp.riskScore}</span>
                      )}
                    </div>
                    <div className="text-xs text-white/40 space-y-1">
                      {fp.userIds?.length > 0 && <p>Accounts ({fp.userIds.length}): <span className="text-yellow-400">{fp.userIds.join(', ')}</span></p>}
                      {fp.userId && <p>Last user: <span className="text-white/60">{fp.userId}</span></p>}
                      {fp.ip && <p>IP: <span className="font-mono text-white/60">{fp.ip}</span></p>}
                      <p>First seen: {formatDistanceToNow(fp.firstSeen, { addSuffix: true })} · Last seen: {formatDistanceToNow(fp.lastSeen, { addSuffix: true })}</p>
                      {fp.banReason && <p className="text-red-400">Reason: {fp.banReason}</p>}
                      {fp.autoBanned && <p className="text-orange-400">⚠️ Auto-banned (multiple accounts)</p>}
                    </div>
                  </div>
                  <div>
                    {fp.banned ? (
                      <GlassButton size="sm" onClick={() => unban({ visitorId: fp.visitorId })}>
                        <Check size={14} />
                      </GlassButton>
                    ) : (
                      <GlassButton variant="danger" size="sm" onClick={() => {
                        const reason = prompt("Ban reason (optional):");
                        ban({ visitorId: fp.visitorId, reason: reason || undefined });
                      }}>
                        <Ban size={14} />
                      </GlassButton>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
