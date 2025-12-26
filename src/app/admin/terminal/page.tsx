"use client";

import { Terminal } from "@/components/admin/Terminal";

export default function TerminalPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-[#161b22] border-b border-[#30363d] px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
        <span className="text-sm text-gray-400 ml-2">admin@pageo: ~</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <Terminal />
      </div>
    </div>
  );
}
