"use client";

import { useAdmin } from "@/lib/admin";
import { useRouter } from "next/navigation";
import { useEffect, ReactNode } from "react";
import Link from "next/link";
import { Terminal, LayoutDashboard, FileText, Users, Shield } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/terminal", label: "Terminal", icon: Terminal },
  { href: "/admin/posts", label: "Posts", icon: FileText },
  { href: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace("/404");
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-green-500 font-mono">Authenticating...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col">
        <div className="p-4 border-b border-[#30363d]">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-green-500" />
            <span className="font-bold text-green-500">Admin Console</span>
          </div>
        </div>
        
        <nav className="flex-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-[#21262d] transition-colors"
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#30363d]">
          <Link
            href="/feed"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Back to Pageo
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
