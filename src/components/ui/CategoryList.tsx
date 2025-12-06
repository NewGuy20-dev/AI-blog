import { Layers, Trophy, Scale, GraduationCap } from "lucide-react";

const categories = [
  { name: "All", icon: Layers },
  { name: "Sports", icon: Trophy },
  { name: "Law", icon: Scale },
  { name: "Education", icon: GraduationCap },
];

interface CategoryListProps {
  selected: string | null;
  onSelect: (cat: string | null) => void;
}

export function CategoryList({ selected, onSelect }: CategoryListProps) {
  return (
    <nav className="flex flex-col gap-1">
      {categories.map(({ name, icon: Icon }) => {
        const isSelected = name === "All" ? selected === null : selected === name;
        return (
          <button
            key={name}
            onClick={() => onSelect(name === "All" ? null : name)}
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
