"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useUser } from "@auth0/nextjs-auth0/client";
import { FileText, Users, Bookmark, Shield, AlertTriangle, Ban, Activity } from "lucide-react";
import Link from "next/link";
import { StatCard } from "@/components/admin/StatCard";
import { GlassCard } from "@/components/admin/GlassCard";
import { GlassButton } from "@/components/admin/GlassButton";
import { useState, useEffect } from "react";

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  blockedIPs: number;
  bannedHardware: number;
  activeThreats: number;
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useUser();
  const isAdmin = useQuery(api.admin.checkAdmin, authLoading || !user ? "skip" : {});
  const stats = useQuery(api.admin.getStats, isAdmin !== true ? "skip" : {});
  const recentPosts = useQuery(api.admin.listPosts, isAdmin !== true ? "skip" : { limit: 5 });
  
  const [securityStats, setSecurityStats] = useState<SecurityStats>({
    totalEvents: 0, criticalEvents: 0, blockedIPs: 0, bannedHardware: 0, activeThreats: 0
  });

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/security/stats').then(r => r.json()).then(setSecurityStats).catch(() => {});
    }
  }, [isAdmin]);

  if (authLoading || isAdmin === undefined) {
    return <div className="flex items-center justify-center h-64"><div className="text-white/60">Loading...</div></div>;
  }

  if (!isAdmin) {
    return (
      <GlassCard variant="danger" className="max-w-md mx-auto mt-12 text-center">
        <Shield className="mx-auto mb-4 text-red-400" size={48} />
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-white/60">You don't have admin privileges.</p>
      </GlassCard>
    );
  }

  const threatLevel = securityStats.criticalEvents > 0 ? "red" : securityStats.activeThreats > 0 ? "yellow" : "green";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-white/50 text-sm">Welcome back, Admin</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <div className={`status-dot status-dot-${threatLevel}`} />
            <span>{threatLevel === "green" ? "All Clear" : threatLevel === "yellow" ? "Monitoring" : "Alert"}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Posts" value={stats?.posts.total ?? "-"} sub={`${stats?.posts.published ?? 0} published`} />
        <StatCard icon={Users} label="Users" value={stats?.users ?? "-"} />
        <StatCard icon={Bookmark} label="Bookmarks" value={stats?.bookmarks ?? "-"} />
        <StatCard icon={Shield} label="Admins" value={stats?.admins ?? "-"} />
      </div>

      {/* Security Summary */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Shield size={20} className="text-violet-400" />
            Security Overview
          </h2>
          <Link href="/admin/security-events">
            <GlassButton variant="secondary" size="sm">View All Events</GlassButton>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold">{securityStats.totalEvents}</p>
            <p className="text-xs text-white/50">Total Events</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-2xl font-bold text-red-400">{securityStats.criticalEvents}</p>
            <p className="text-xs text-white/50">Critical</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold">{securityStats.blockedIPs}</p>
            <p className="text-xs text-white/50">Blocked IPs</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <p className="text-2xl font-bold">{securityStats.bannedHardware}</p>
            <p className="text-xs text-white/50">Hardware Bans</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-2xl font-bold text-orange-400">{securityStats.activeThreats}</p>
            <p className="text-xs text-white/50">Active Threats</p>
          </div>
        </div>
      </GlassCard>

      {/* Quick Actions & Recent Posts */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlassCard>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-400" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            <Link href="/admin/emergency-lockdown" className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors">
              <AlertTriangle size={18} className="text-red-400" />
              <span>Emergency Lockdown</span>
            </Link>
            <Link href="/admin/hardware-bans" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Ban size={18} className="text-violet-400" />
              <span>Manage Hardware Bans</span>
            </Link>
            <Link href="/admin/security-events" className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <Activity size={18} className="text-violet-400" />
              <span>View Security Events</span>
            </Link>
          </div>
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-violet-400" />
            Recent Posts
          </h2>
          <div className="space-y-2">
            {recentPosts?.slice(0, 4).map((post) => (
              <div key={post._id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm">{post.title}</p>
                  <p className="text-xs text-white/40">{post.slug}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  post.status === "published" ? "bg-green-500/20 text-green-400" :
                  post.status === "draft" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/50"
                }`}>{post.status}</span>
              </div>
            ))}
            {!recentPosts && <div className="text-white/40 text-center py-4">Loading...</div>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
