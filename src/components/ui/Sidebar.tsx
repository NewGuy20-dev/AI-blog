"use client";

import { useState } from "react";
import { Menu, X, Bookmark } from "lucide-react";
import Link from "next/link";
import { Logo } from "./Logo";
import { CategoryList } from "./CategoryList";
import { UserMenu } from "./UserMenu";

interface SidebarProps {
  selectedCategory: string | null;
  onSelectCategory: (cat: string | null) => void;
}

export function Sidebar({ selectedCategory, onSelectCategory }: SidebarProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (cat: string | null) => {
    onSelectCategory(cat);
    setOpen(false);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-5 left-5 z-50 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm"
        aria-label="Open menu"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full z-50
          w-72 bg-[var(--color-sidebar)] border-r border-[var(--color-border)]
          flex flex-col py-8 px-6
          md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          transition-transform duration-300 ease-out
        `}
      >
        {/* Mobile close */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-5 right-5 p-2 rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        <div className="mb-10">
          <Logo />
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 text-[var(--color-text-muted)] mb-6">
            <Menu size={18} strokeWidth={1.5} />
            <span className="text-xs font-medium uppercase tracking-wider">Categories</span>
          </div>
          <CategoryList selected={selectedCategory} onSelect={handleSelect} />
        </div>

        {/* Bookmarks link */}
        <Link
          href="/bookmarks"
          className="flex items-center gap-3 px-4 py-3 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/50 hover:text-[var(--color-text)] rounded-xl transition-all mb-4"
        >
          <Bookmark size={18} strokeWidth={1.5} />
          Bookmarks
        </Link>

        <div className="mt-auto pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
          <p className="text-xs text-[var(--color-text-muted)]">© 2024 Pageo</p>
          <UserMenu />
        </div>
      </aside>
    </>
  );
}
