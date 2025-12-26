"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

const STORAGE_KEY = "pageo_bookmarks";

export function useBookmarks() {
  const { user, isLoading } = useUser();
  const isSignedIn = !!user;
  const isLoaded = !isLoading;
  
  const [localBookmarks, setLocalBookmarks] = useState<string[]>([]);

  const convexBookmarks = useQuery(
    api.bookmarks.getUserBookmarks,
    isSignedIn ? {} : "skip"
  );
  const toggleMutation = useMutation(api.bookmarks.toggle);
  const clearMutation = useMutation(api.bookmarks.clear);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setLocalBookmarks(JSON.parse(stored));

    const handleUpdate = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setLocalBookmarks(stored ? JSON.parse(stored) : []);
    };

    window.addEventListener("storage", handleUpdate);
    window.addEventListener("bookmarks-updated", handleUpdate);
    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("bookmarks-updated", handleUpdate);
    };
  }, []);

  const bookmarks = isSignedIn ? (convexBookmarks ?? []) : localBookmarks;

  const toggle = useCallback(
    async (slug: string) => {
      if (isSignedIn) {
        try {
          const result = await toggleMutation({ postSlug: slug });
          toast.success(result.bookmarked ? "Bookmarked" : "Removed from bookmarks");
        } catch {
          toast.error("Failed to update bookmark");
        }
      } else {
        setLocalBookmarks((prev) => {
          const isBookmarked = prev.includes(slug);
          const next = isBookmarked ? prev.filter((s) => s !== slug) : [...prev, slug];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          window.dispatchEvent(new Event("bookmarks-updated"));
          toast.success(isBookmarked ? "Removed from bookmarks" : "Bookmarked");
          return next;
        });
      }
    },
    [isSignedIn, toggleMutation]
  );

  const isBookmarked = useCallback(
    (slug: string) => bookmarks.includes(slug),
    [bookmarks]
  );

  const clear = useCallback(async () => {
    if (isSignedIn) {
      try {
        await clearMutation({});
        toast.success("All bookmarks cleared");
      } catch {
        toast.error("Failed to clear bookmarks");
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setLocalBookmarks([]);
      window.dispatchEvent(new Event("bookmarks-updated"));
      toast.success("All bookmarks cleared");
    }
  }, [isSignedIn, clearMutation]);

  return {
    bookmarks,
    toggle,
    isBookmarked,
    clear,
    count: bookmarks.length,
    isLoaded,
    isSignedIn,
  };
}
