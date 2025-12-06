"use client";

import Link from "next/link";
import Image from "next/image";
import { Moon, Sun, Bookmark } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-card)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="pageo-logo w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center overflow-hidden">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
          </div>
          <span className="text-lg font-bold">Pageo</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/bookmarks"
            className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
            aria-label="Bookmarks"
          >
            <Bookmark size={20} />
          </Link>
          <button
            onClick={toggle}
            className="p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors ml-2"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
