"use client";

import { useEffect, useState } from "react";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("bookmarks");
    if (stored) setBookmarks(JSON.parse(stored));
  }, []);

  const toggle = (slug: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem("bookmarks", JSON.stringify(next));
      return next;
    });
  };

  const isBookmarked = (slug: string) => bookmarks.includes(slug);

  return { bookmarks, toggle, isBookmarked };
}
