"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardNav(slugs: string[]) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    switch (e.key) {
      case "j":
        setSelectedIndex((i) => Math.min(i + 1, slugs.length - 1));
        break;
      case "k":
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (selectedIndex >= 0 && slugs[selectedIndex]) {
          router.push(`/posts/${slugs[selectedIndex]}`);
        }
        break;
      case "Escape":
        setSelectedIndex(-1);
        break;
    }
  }, [slugs, selectedIndex, router]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (selectedIndex >= 0) {
      document.getElementById(`article-${selectedIndex}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedIndex]);

  return { selectedIndex, setSelectedIndex };
}
