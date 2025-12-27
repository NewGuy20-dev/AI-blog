"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import { Fingerprint, Ban, Check, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function FingerprintsPage() {
  const [bannedOnly, setBannedOnly] = useState(false);
  const [searchUserId, setSearchUserId] = useState("");
  
  const fingerprints = useQuery(api.fingerprints.list, { bannedOnly });
  const userFingerprints = useQuery(
    api.fingerprints.getByUserId,
    searchUserId ? { userId: searchUserId } : "skip"
  );
  const ban = useMutation(api.fingerprints.ban);
  const unban = useMutation(api.fingerprints.unban);

  const displayList = searchUserId && userFingerprints ? userFingerprints : fingerprints;

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <Fingerprint className="text-purple-500" />
        <h1 className="text-2xl font-bold">Browser Fingerprints</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={searchUserId}
            onChange={(e) => setSearchUserId(e.target.value)}
            placeholder="Search by User ID..."
            className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm w-64"
          />
          <Search size={18} className="text-gray-500" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={bannedOnly}
            onChange={(e) => setBannedOnly(e.target.checked)}
            className="rounded"
          />
          Banned only
        </label>
      </div>

      {/* List */}
      {!displayList ? (
        <div className="text-gray-500">Loading...</div>
      ) : displayList.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Fingerprint size={48} className="mx-auto mb-4 opacity-50" />
          <p>No fingerprints found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayList.map((fp: any) => (
            <div
              key={fp._id}
              className={`p-4 bg-[#161b22] rounded-lg border ${fp.banned ? 'border-red-500/50' : 'border-[#30363d]'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-purple-400">{fp.visitorId}</code>
                    {fp.banned && (
                      <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">BANNED</span>
                    )}
                    {fp.restricted && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">RESTRICTED</span>
                    )}
                    {fp.riskScore !== undefined && (
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        fp.riskScore >= 8 ? 'bg-red-500/20 text-red-400' :
                        fp.riskScore >= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                        fp.riskScore >= 3 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        Risk: {fp.riskScore}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-500 space-y-1">
                    {fp.userIds && fp.userIds.length > 0 && (
                      <p>Accounts ({fp.userIds.length}): <span className="text-yellow-400">{fp.userIds.join(', ')}</span></p>
                    )}
                    {fp.userId && <p>Last user: <span className="text-gray-400">{fp.userId}</span></p>}
                    {fp.ip && <p>IP: <span className="text-gray-400">{fp.ip}</span></p>}
                    <p>First seen: {formatDistanceToNow(fp.firstSeen, { addSuffix: true })}</p>
                    <p>Last seen: {formatDistanceToNow(fp.lastSeen, { addSuffix: true })}</p>
                    {fp.banReason && <p className="text-red-400">Reason: {fp.banReason}</p>}
                    {fp.autoBanned && <p className="text-orange-400">⚠️ Auto-banned (multiple accounts)</p>}
                  </div>
                </div>
                <div>
                  {fp.banned ? (
                    <button
                      onClick={() => unban({ visitorId: fp.visitorId })}
                      className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                      title="Unban"
                    >
                      <Check size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const reason = prompt("Ban reason (optional):");
                        ban({ visitorId: fp.visitorId, reason: reason || undefined });
                      }}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Ban"
                    >
                      <Ban size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
