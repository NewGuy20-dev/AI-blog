"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "pageo_bookmarks";

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setBookmarks(JSON.parse(stored));

    const handleUpdate = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setBookmarks(stored ? JSON.parse(stored) : []);
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("bookmarks-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("bookmarks-updated", handleUpdate);
    };
  }, []);

  const toggle = useCallback((slug: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(slug) 
        ? prev.filter((s) => s !== slug) 
        : [...prev, slug];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("bookmarks-updated"));
      return next;
    });
  }, []);

  const isBookmarked = useCallback((slug: string) => bookmarks.includes(slug), [bookmarks]);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setBookmarks([]);
    window.dispatchEvent(new Event("bookmarks-updated"));
  }, []);

  return { bookmarks, toggle, isBookmarked, clear, count: bookmarks.length };
}
