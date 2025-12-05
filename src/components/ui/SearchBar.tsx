"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [input, setInput] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => onChange(input), 300);
    return () => clearTimeout(timer);
  }, [input, onChange]);

  return (
    <div className="relative">
      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search articles..."
        className="w-full pl-10 pr-10 py-2 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none text-sm transition-colors"
      />
      {input && (
        <button
          onClick={() => { setInput(""); onChange(""); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
