"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactNode } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard, Shield, AlertTriangle, Ban, Fingerprint, CheckCircle,
  Users, FileText, HeadphonesIcon, Zap, Terminal, Menu, X, ArrowLeft, Activity, Loader2
} from "lucide-react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Security",
    items: [
      { href: "/admin/security-events", label: "Events", icon: Activity },
      { href: "/admin/emergency-lockdown", label: "Lockdown", icon: AlertTriangle },
      { href: "/admin/hardware-bans", label: "Hardware Bans", icon: Ban },
      { href: "/admin/blocked-ips", label: "Blocked IPs", icon: Shield },
      { href: "/admin/fingerprints", label: "Fingerprints", icon: Fingerprint },
      { href: "/admin/trusted-devices", label: "Trusted Devices", icon: CheckCircle },
    ],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/posts", label: "Posts", icon: FileText },
      { href: "/admin/support", label: "Support", icon: HeadphonesIcon },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/logs", label: "Logs", icon: Zap },
      { href: "/admin/terminal", label: "Terminal", icon: Terminal },
    ],
  },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Auth check
  const { user, isLoading: authLoading } = useUser();
  const isAdmin = useQuery(api.admin.checkAdmin, authLoading || !user ? "skip" : {});

  const isActive = (href: string) => pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

  // Loading state - only while auth is loading
  if (authLoading) {
    return (
      <div className="admin-gradient min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-white/60">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="admin-gradient min-h-screen flex items-center justify-center">
        <div className="glass p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">You must be logged in to access the admin panel.</p>
          <a href="/auth/login" className="glass-btn px-6 py-3 rounded-lg inline-block">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Waiting for admin check
  if (isAdmin === undefined) {
    return (
      <div className="admin-gradient min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-white/60">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="admin-gradient min-h-screen flex items-center justify-center">
        <div className="glass p-8 max-w-md text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-white/60 mb-6">You don't have admin privileges.</p>
          <Link href="/feed" className="glass-btn px-6 py-3 rounded-lg inline-block">
            Back to Site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-gradient text-white min-h-screen flex relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/60 z-40" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-64 glass-sidebar z-50 flex flex-col
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Shield size={18} className="text-violet-400" />
            </div>
            <span className="font-semibold">Admin</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 hover:bg-white/10 rounded">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 px-3">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive(item.href)
                        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          <Link
            href="/feed"
            className="flex items-center gap-2 px-3 py-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen relative z-10">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-30 glass-sidebar p-4 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-white/10 rounded-lg">
            <Menu size={20} />
          </button>
          <span className="font-semibold">Admin Panel</span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
