"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ShieldBan, Trash2, Plus, Info } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function BlockedIpsPage() {
  const blockedIps = useQuery(api.blockedIps.listBlocked);
  const blockIp = useMutation(api.blockedIps.blockIp);
  const unblockIp = useMutation(api.blockedIps.unblockIp);

  const [newIp, setNewIp] = useState("");
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<number | undefined>();
  const [myIp, setMyIp] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/check-ip')
      .then(res => res.json())
      .then(data => setMyIp(data.ip))
      .catch(() => {});
  }, []);

  const handleBlock = async () => {
    if (!newIp.trim()) return;
    await blockIp({ ip: newIp.trim(), reason: reason || undefined, durationDays: duration });
    setNewIp("");
    setReason("");
    setDuration(undefined);
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <ShieldBan className="text-red-500" />
        <h1 className="text-2xl font-bold">Blocked IPs</h1>
      </div>

      {/* Current IP Info */}
      {myIp && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg mb-6 flex items-center gap-3">
          <Info size={18} className="text-blue-400" />
          <span className="text-sm">Your current IP: <code className="font-mono bg-blue-500/20 px-2 py-0.5 rounded">{myIp}</code></span>
        </div>
      )}

      {/* Add new IP */}
      <div className="p-4 bg-[#161b22] rounded-lg border border-[#30363d] mb-6">
        <h2 className="text-sm font-medium text-gray-400 mb-3">Block New IP</h2>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={newIp}
            onChange={(e) => setNewIp(e.target.value)}
            placeholder="IP Address (e.g., 192.168.1.1)"
            className="flex-1 min-w-[200px] px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm"
          />
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 min-w-[150px] px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm"
          />
          <select
            value={duration || ""}
            onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : undefined)}
            className="px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm"
          >
            <option value="">Permanent</option>
            <option value="1">1 day</option>
            <option value="7">7 days</option>
            <option value="30">30 days</option>
            <option value="365">1 year</option>
          </select>
          <button
            onClick={handleBlock}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Block
          </button>
        </div>
      </div>

      {/* List */}
      {!blockedIps ? (
        <div className="text-gray-500">Loading...</div>
      ) : blockedIps.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShieldBan size={48} className="mx-auto mb-4 opacity-50" />
          <p>No blocked IPs</p>
        </div>
      ) : (
        <div className="space-y-2">
          {blockedIps.map((item: any) => (
            <div
              key={item._id}
              className="p-4 bg-[#161b22] rounded-lg border border-[#30363d] flex items-center justify-between"
            >
              <div>
                <p className="font-mono font-medium">{item.ip}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Blocked {formatDistanceToNow(item.blockedAt, { addSuffix: true })}
                  {item.expiresAt && ` · Expires ${formatDistanceToNow(item.expiresAt, { addSuffix: true })}`}
                </p>
                {item.reason && <p className="text-xs text-gray-400 mt-1">Reason: {item.reason}</p>}
              </div>
              <button
                onClick={() => unblockIp({ ip: item.ip })}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
