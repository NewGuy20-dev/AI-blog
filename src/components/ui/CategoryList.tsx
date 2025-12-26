"use client";

import { CATEGORIES } from "@/lib/constants/categories";

interface CategoryListProps {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryList({ selected, onSelect }: CategoryListProps) {
  return (
    <nav className="flex flex-col gap-1 max-h-[60vh] overflow-y-auto pr-2">
      {CATEGORIES.map(({ id, name, icon: Icon }) => {
        const isSelected = id === "all" ? selected === null : selected === name;
        return (
          <button
            key={id}
            onClick={() => onSelect(id === "all" ? null : name)}
            className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
              isSelected
                ? "bg-[var(--color-primary)] text-white font-medium"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/50 hover:text-[var(--color-text)]"
            }`}
          >
            <Icon size={18} strokeWidth={1.5} />
            {name}
          </button>
        );
      })}
    </nav>
  );
}
