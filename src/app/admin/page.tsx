"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { FileText, Users, Bookmark, Shield, Activity } from "lucide-react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useUser();
  const isAdmin = useQuery(api.admin.checkAdmin, authLoading || !user ? "skip" : {});
  const stats = useQuery(api.admin.getStats, isAdmin !== true ? "skip" : {});
  const recentPosts = useQuery(api.admin.listPosts, isAdmin !== true ? "skip" : { limit: 5 });

  if (authLoading || isAdmin === undefined) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="text-red-500">Access denied. You are not an admin.</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={FileText}
          label="Total Posts"
          value={stats?.posts.total ?? "-"}
          sub={`${stats?.posts.published ?? 0} published`}
        />
        <StatCard
          icon={Users}
          label="Users"
          value={stats?.users ?? "-"}
        />
        <StatCard
          icon={Bookmark}
          label="Bookmarks"
          value={stats?.bookmarks ?? "-"}
        />
        <StatCard
          icon={Shield}
          label="Admins"
          value={stats?.admins ?? "-"}
        />
      </div>

      {/* Post Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
          <h2 className="text-lg font-semibold mb-4">Post Status</h2>
          <div className="space-y-3">
            <StatusBar label="Published" value={stats?.posts.published ?? 0} total={stats?.posts.total ?? 1} color="bg-green-500" />
            <StatusBar label="Draft" value={stats?.posts.draft ?? 0} total={stats?.posts.total ?? 1} color="bg-yellow-500" />
            <StatusBar label="Archived" value={stats?.posts.archived ?? 0} total={stats?.posts.total ?? 1} color="bg-gray-500" />
          </div>
        </div>

        <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/terminal"
              className="flex items-center gap-3 p-3 rounded-lg bg-[#21262d] hover:bg-[#30363d] transition-colors"
            >
              <Activity size={18} className="text-green-500" />
              <span>Open Terminal</span>
            </Link>
            <Link
              href="/admin/posts"
              className="flex items-center gap-3 p-3 rounded-lg bg-[#21262d] hover:bg-[#30363d] transition-colors"
            >
              <FileText size={18} className="text-blue-500" />
              <span>Manage Posts</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
        <div className="space-y-2">
          {recentPosts?.map((post) => (
            <div
              key={post._id}
              className="flex items-center justify-between p-3 rounded-lg bg-[#21262d]"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{post.title}</p>
                <p className="text-sm text-gray-500">{post.slug}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                post.status === "published" ? "bg-green-500/20 text-green-400" :
                post.status === "draft" ? "bg-yellow-500/20 text-yellow-400" :
                "bg-gray-500/20 text-gray-400"
              }`}>
                {post.status}
              </span>
            </div>
          ))}
          {!recentPosts && (
            <div className="text-gray-500 text-center py-4">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: {
  icon: any;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon size={20} className="text-gray-500" />
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-sm text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function StatusBar({ label, value, total, color }: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-[#21262d] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
