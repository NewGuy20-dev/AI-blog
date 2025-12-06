"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, ArrowUpRight } from "lucide-react";
import { useBookmarks } from "@/lib/hooks/useBookmarks";

interface ArticleCardProps {
  post: {
    slug: string;
    title: string;
    summary: string;
    publishedAt: number;
    readingTime: number;
    tags: string[];
  };
}

export function ArticleCard({ post }: ArticleCardProps) {
  const { toggle, isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(post.slug);
  const isNew = Date.now() - post.publishedAt < 24 * 60 * 60 * 1000;

  return (
    <article className="group h-full bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-all duration-200 overflow-hidden">
      <Link href={`/posts/${post.slug}`} className="flex flex-col h-full p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {isNew && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                New
              </span>
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-md">
              {post.tags[0] || "General"}
            </span>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(post.slug); }}
            className={`p-2 -m-1 rounded-lg transition-all ${
              bookmarked 
                ? "text-[var(--color-primary)]" 
                : "text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-primary)]"
            }`}
            aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark size={16} strokeWidth={1.5} className={bookmarked ? "fill-current" : ""} />
          </button>
        </div>

        {/* Content */}
        <h2 className="text-base font-semibold leading-snug mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed line-clamp-2 flex-1">
          {post.summary}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatDistanceToNow(post.publishedAt, { addSuffix: true })} · {post.readingTime} min
          </span>
          <ArrowUpRight 
            size={16} 
            strokeWidth={1.5}
            className="text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" 
          />
        </div>
      </Link>
    </article>
  );
}
