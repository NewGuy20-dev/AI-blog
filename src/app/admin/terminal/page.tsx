"use client";

import { Terminal as TerminalIcon } from "lucide-react";
import { GlassCard } from "@/components/admin/GlassCard";

export default function TerminalPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <TerminalIcon className="text-green-400" />
          Terminal
        </h1>
        <p className="text-white/50 text-sm">Admin command interface</p>
      </div>

      <GlassCard padding="sm" className="overflow-hidden">
        <div className="bg-black/50 border-b border-white/10 px-4 py-2 flex items-center gap-2 -m-4 mb-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-sm text-white/40 ml-2">admin@pageo: ~</span>
        </div>
        <div className="h-[60vh] bg-black/30 p-4 font-mono text-sm text-green-400">
          <p>$ Welcome to Pageo Admin Terminal</p>
          <p className="text-white/40 mt-2">Terminal functionality coming soon...</p>
          <p className="mt-4 animate-pulse">█</p>
        </div>
      </GlassCard>
    </div>
  );
}
