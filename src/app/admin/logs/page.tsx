"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { isAdmin } from "@/lib/constants";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ChevronDown, ChevronRight, CheckCircle, XCircle, AlertTriangle, Clock, Zap } from "lucide-react";
import { GlassCard } from "@/components/admin/GlassCard";

type RunStatus = "published" | "rejected" | "failed" | "running" | "draft";

const statusColors: Record<RunStatus, string> = {
  published: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  failed: "bg-red-500/20 text-red-400",
  running: "bg-yellow-500/20 text-yellow-400",
  draft: "bg-blue-500/20 text-blue-400",
};

function CheckBadge({ passed }: { passed: boolean }) {
  return passed ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />;
}

function RunDetails({ runId, userId }: { runId: string; userId: string }) {
  const details = useQuery(api.audit.getRunDetails, { userId, runId });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!details) return <div className="p-4 text-sm text-white/50">Loading...</div>;

  return (
    <div className="border-t border-white/10 bg-white/5">
      {details.map((log, i) => {
        const isExpanded = expanded[`${i}`];
        const hasCritiqueData = log.stage.startsWith("critique_") && log.output;
        let checkResults = null, issues = null;
        if (hasCritiqueData) {
          try {
            const output = typeof log.output === "string" ? JSON.parse(log.output) : log.output;
            checkResults = output.checkResults;
            issues = output.issues;
          } catch {}
        }

        return (
          <div key={i} className="border-b border-white/5 last:border-0">
            <button
              onClick={() => setExpanded(e => ({ ...e, [`${i}`]: !e[`${i}`] }))}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 text-left"
            >
              {hasCritiqueData ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4" />}
              <span className="font-mono text-xs text-white/50">{log.stage}</span>
              <span className={`text-xs px-2 py-0.5 rounded ${
                log.status === "success" || log.status === "publish" ? "bg-green-500/20 text-green-400" :
                log.status === "failed" || log.status === "reject" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
              }`}>{log.status}</span>
            </button>
            {isExpanded && checkResults && (
              <div className="px-4 pb-4 space-y-3">
                {Object.entries(checkResults).map(([category, checks]) => (
                  <div key={category} className="bg-black/20 rounded-lg p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 text-white/50">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {(checks as Array<{ name: string; passed: boolean }>).map((check) => (
                        <div key={check.name} className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${check.passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          <CheckBadge passed={check.passed} />
                          <span className="font-mono">{check.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {issues && issues.length > 0 && (
                  <div className="bg-red-500/10 rounded-lg p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide mb-2 text-red-400">Issues ({issues.length})</h4>
                    <ul className="space-y-1 text-xs">
                      {issues.map((issue: any, j: number) => (
                        <li key={j} className="flex items-start gap-2">
                          <AlertTriangle size={12} className="mt-0.5 text-red-400 shrink-0" />
                          <span><span className="font-mono text-red-400">{issue.category}/{issue.subcategory}</span> - {issue.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AdminLogsPage() {
  const { user, isLoading } = useUser();
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const userId = user?.sub || "";
  const runs = useQuery(api.audit.getRecentRuns, { userId, limit: 30 });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="text-white/50">Loading...</div></div>;

  if (!user || !isAdmin(user.sub)) {
    return (
      <GlassCard variant="danger" className="max-w-md mx-auto mt-12 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-white/60">Admin access required</p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Zap className="text-violet-400" />
          Pipeline Logs
        </h1>
        <p className="text-white/50 text-sm">View AI content pipeline runs</p>
      </div>

      {!runs ? (
        <div className="text-center py-12 text-white/50">Loading...</div>
      ) : runs.length === 0 ? (
        <div className="text-center py-12 text-white/50">No pipeline runs yet</div>
      ) : (
        <div className="space-y-3">
          {runs.map((run) => (
            <GlassCard key={run.runId} padding="sm" className="overflow-hidden">
              <button
                onClick={() => setExpandedRun(expandedRun === run.runId ? null : run.runId)}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-white/5 text-left -m-4 mb-0"
              >
                <div className="flex items-center gap-3">
                  {expandedRun === run.runId ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <div>
                    <div className="font-medium">{run.topic || "Unknown topic"}</div>
                    <div className="text-xs text-white/40 flex items-center gap-2 mt-1">
                      <Clock size={12} />
                      {formatDistanceToNow(run.startedAt, { addSuffix: true })}
                      <span className="font-mono opacity-50">{run.runId.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusColors[run.status as RunStatus] || statusColors.running}`}>
                  {run.status}
                </span>
              </button>
              {expandedRun === run.runId && <RunDetails runId={run.runId} userId={userId} />}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
