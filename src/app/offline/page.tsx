"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-20 h-20 rounded-2xl bg-[var(--color-border)]/30 flex items-center justify-center mb-8">
        <WifiOff size={40} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
      </div>
      
      <h1 className="text-2xl font-bold mb-3 text-center">You&apos;re offline</h1>
      <p className="text-[var(--color-text-muted)] text-center mb-8 max-w-sm">
        Check your internet connection and try again. Some cached content may still be available.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 bg-[var(--color-primary)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          <RefreshCw size={18} strokeWidth={1.5} />
          Try again
        </button>
        <Link
          href="/feed"
          className="px-6 py-3 border border-[var(--color-border)] rounded-full font-medium hover:bg-[var(--color-accent)]/50 transition-colors"
        >
          Go to feed
        </Link>
      </div>
    </div>
  );
}
