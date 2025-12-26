"use client";

interface TagFilterProps {
  tags: string[];
  selected: string | null;
  onSelect: (tag: string | null) => void;
}

export function TagFilter({ tags, selected, onSelect }: TagFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          selected === null
            ? "bg-[var(--color-primary)] text-white"
            : "bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onSelect(tag)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selected === tag
              ? "bg-[var(--color-primary)] text-white"
              : "bg-[var(--color-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)]"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
