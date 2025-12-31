"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

const STORAGE_KEY = "pageo_read_articles";

export function useReadingTracker(slug: string, readingTimeMinutes: number | undefined) {
  const { user } = useUser();
  const markRead = useMutation(api.readArticles.markArticleRead);
  const triggered = useRef(false);

  useEffect(() => {
    if (!user || triggered.current || !readingTimeMinutes) return;

    // Check localStorage to avoid re-triggering
    const read = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (read.includes(slug)) return;

    const thresholdMs = (readingTimeMinutes * 60 * 1000) / 4;
    console.log(`[ReadingTracker] Starting timer for ${slug}: ${thresholdMs}ms (${readingTimeMinutes} min read)`);

    const timer = setTimeout(async () => {
      if (triggered.current) return;
      triggered.current = true;
      console.log(`[ReadingTracker] Timer fired for ${slug}`);

      try {
        const result = await markRead({ postSlug: slug });
        console.log(`[ReadingTracker] Result:`, result);
        if (!result.alreadyRead && !result.notAuthenticated) {
          const updated = [...read, slug];
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          toast.success("Article marked as read!");
        }
      } catch (e) {
        console.error(`[ReadingTracker] Error:`, e);
      }
    }, thresholdMs);

    return () => clearTimeout(timer);
  }, [slug, readingTimeMinutes, user, markRead]);
}
