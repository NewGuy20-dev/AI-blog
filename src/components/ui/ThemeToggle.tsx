"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-accent)] transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
