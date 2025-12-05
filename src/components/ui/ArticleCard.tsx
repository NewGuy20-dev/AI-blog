"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, Clock } from "lucide-react";
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
    <article className="h-full p-6 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] card-hover flex flex-col relative group">
      <button
        onClick={(e) => { e.preventDefault(); toggle(post.slug); }}
        className="absolute top-4 right-4 p-2 rounded-lg hover:bg-[var(--color-border)] transition-colors z-10"
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      >
        <Bookmark size={18} className={bookmarked ? "fill-[var(--color-primary)] text-[var(--color-primary)]" : ""} />
      </button>
      <Link href={`/posts/${post.slug}`} className="flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {isNew && (
            <span className="text-xs font-semibold text-white bg-green-500 px-2 py-0.5 rounded-full">
              New
            </span>
          )}
          <span className="text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full">
            {post.tags[0] || "AI"}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">
            {formatDistanceToNow(post.publishedAt, { addSuffix: true })}
          </span>
        </div>
        <h2 className="text-lg font-bold mb-2 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-[var(--color-text-muted)] text-sm line-clamp-3 flex-1">{post.summary}</p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--color-border)]">
          <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Clock size={14} />
            {post.readingTime} min read
          </span>
          <span className="text-xs font-medium text-[var(--color-primary)] group-hover:translate-x-1 transition-transform">
            Read →
          </span>
        </div>
      </Link>
    </article>
  );
}
