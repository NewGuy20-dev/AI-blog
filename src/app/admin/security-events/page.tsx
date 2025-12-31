"use client";

import { useState, useEffect } from "react";
import { Activity, Search, Filter, Ban, Shield, ChevronDown, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";

interface SecurityEvent {
  id: string;
  eventType: string;
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  ip: string;
  userAgent?: string;
  timestamp: number;
  blocked: boolean;
  details: Record<string, unknown>;
}

const severityColors = {
  low: "bg-green-500/20 text-green-400 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function SecurityEventsPage() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const res = await fetch("/api/security/events");
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIP = async (ip: string) => {
    if (!confirm(`Block IP ${ip}?`)) return;
    await fetch("/api/security/hardware-ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ip, reason: "Manual block from events", hardwareBan: true }),
    });
    loadEvents();
  };

  const filtered = events.filter((e) => {
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    if (search && !e.ip.includes(search) && !e.userId?.includes(search) && !e.eventType.includes(search)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Activity className="text-violet-400" />
            Security Events
          </h1>
          <p className="text-white/50 text-sm">Monitor and manage security events</p>
        </div>
        <GlassButton onClick={loadEvents}>Refresh</GlassButton>
      </div>

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search by IP, user, or event type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-white/40" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="glass-input px-3 py-2"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Events List */}
      <GlassCard padding="sm">
        {loading ? (
          <div className="text-center py-12 text-white/50">Loading events...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-white/50">
            <Activity size={48} className="mx-auto mb-4 opacity-50" />
            <p>No security events found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {filtered.map((event) => (
              <div key={event.id} className="py-3">
                <div
                  className="flex items-center gap-4 cursor-pointer hover:bg-white/5 -mx-4 px-4 py-2 rounded-lg transition-colors"
                  onClick={() => setExpanded(expanded === event.id ? null : event.id)}
                >
                  {expanded === event.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className={`px-2 py-1 text-xs rounded border ${severityColors[event.severity]}`}>
                    {event.severity.toUpperCase()}
                  </span>
                  <span className="font-medium flex-1">{event.eventType}</span>
                  <span className="text-sm text-white/50 font-mono">{event.ip}</span>
                  {event.blocked && <span className="text-xs text-red-400">BLOCKED</span>}
                  <span className="text-xs text-white/40">{new Date(event.timestamp).toLocaleString()}</span>
                </div>
                {expanded === event.id && (
                  <div className="mt-3 ml-8 p-4 rounded-lg bg-white/5 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-white/50">User ID:</span> <span className="font-mono">{event.userId || "N/A"}</span></div>
                      <div><span className="text-white/50">IP:</span> <span className="font-mono">{event.ip}</span></div>
                    </div>
                    {event.userAgent && (
                      <div className="text-sm"><span className="text-white/50">User Agent:</span> <span className="text-xs text-white/70 break-all">{event.userAgent}</span></div>
                    )}
                    <div className="text-sm">
                      <span className="text-white/50">Details:</span>
                      <pre className="mt-1 text-xs bg-black/30 p-2 rounded overflow-x-auto">{JSON.stringify(event.details, null, 2)}</pre>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <GlassButton variant="danger" size="sm" onClick={() => handleBlockIP(event.ip)}>
                        <Ban size={14} className="mr-1" /> Block IP & Hardware
                      </GlassButton>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
