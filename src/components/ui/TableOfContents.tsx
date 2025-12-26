"use client";

import { useState } from "react";
import { ChevronDown, List } from "lucide-react";

interface ContentBlock {
  type: string;
  text?: string;
  level?: number;
}

interface TableOfContentsProps {
  content: ContentBlock[];
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [open, setOpen] = useState(false);
  
  const headings = content
    .filter((b) => b.type === "heading" && b.text)
    .map((b, i) => ({ id: `heading-${i}`, text: b.text!, level: b.level || 2 }));

  if (headings.length === 0) return null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <div className="mb-8">
      {/* Mobile: collapsible */}
      <div className="lg:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
        >
          <List size={16} />
          Table of Contents
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <nav className="mt-3 pl-4 border-l-2 border-[var(--color-border)]">
            {headings.map((h) => (
              <button
                key={h.id}
                onClick={() => scrollTo(h.id)}
                className={`block text-sm py-1 text-left text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors ${h.level > 2 ? "pl-4" : ""}`}
              >
                {h.text}
              </button>
            ))}
          </nav>
        )}
      </div>
      {/* Desktop: always visible */}
      <nav className="hidden lg:block pl-4 border-l-2 border-[var(--color-border)]">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Contents</p>
        {headings.map((h) => (
          <button
            key={h.id}
            onClick={() => scrollTo(h.id)}
            className={`block text-sm py-1 text-left text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors ${h.level > 2 ? "pl-4" : ""}`}
          >
            {h.text}
          </button>
        ))}
      </nav>
    </div>
  );
}
