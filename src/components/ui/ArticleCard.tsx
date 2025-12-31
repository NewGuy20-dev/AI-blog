"use client";

import Link from "next/link";
import Image from "next/image";
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
    featuredImage?: { url: string; alt: string } | null;
  };
}

function PlaceholderImage({ category }: { category: string }) {
  const colors: Record<string, { bg: string; accent: string }> = {
    Technology: { bg: "from-blue-900 to-blue-700", accent: "text-blue-400" },
    Business: { bg: "from-green-900 to-green-700", accent: "text-green-400" },
    Sports: { bg: "from-orange-900 to-orange-700", accent: "text-orange-400" },
    Entertainment: { bg: "from-purple-900 to-purple-700", accent: "text-purple-400" },
    Health: { bg: "from-red-900 to-red-700", accent: "text-red-400" },
    Science: { bg: "from-cyan-900 to-cyan-700", accent: "text-cyan-400" },
    Politics: { bg: "from-gray-800 to-gray-600", accent: "text-gray-400" },
    World: { bg: "from-indigo-900 to-indigo-700", accent: "text-indigo-400" },
    Lifestyle: { bg: "from-pink-900 to-pink-700", accent: "text-pink-400" },
    Opinion: { bg: "from-yellow-900 to-yellow-700", accent: "text-yellow-400" },
    default: { bg: "from-slate-900 to-slate-700", accent: "text-purple-400" },
  };
  
  const { bg, accent } = colors[category] || colors.default;
  
  return (
    <div className={`w-full h-40 bg-gradient-to-br ${bg} flex items-center justify-center`}>
      <div className={`text-4xl font-bold ${accent} opacity-20`}>
        {category.charAt(0)}
      </div>
    </div>
  );
}

export function ArticleCard({ post }: ArticleCardProps) {
  const { toggle, isBookmarked } = useBookmarks();
  const bookmarked = isBookmarked(post.slug);
  const isNew = Date.now() - post.publishedAt < 24 * 60 * 60 * 1000;
  const category = post.tags[0] || "General";

  return (
    <article className="group relative h-full bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 transition-all duration-200 overflow-hidden flex flex-col">
      {/* Bookmark button outside Link */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(post.slug);
        }}
        className={`absolute top-44 right-5 z-10 p-2 rounded-lg transition-all ${
          bookmarked 
            ? "text-[var(--color-primary)]" 
            : "text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--color-primary)]"
        }`}
        aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      >
        <Bookmark size={16} strokeWidth={1.5} className={bookmarked ? "fill-current" : ""} />
      </button>

      <Link href={`/posts/${post.slug}`} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative w-full h-40 bg-[var(--color-border)] overflow-hidden">
          {post.featuredImage?.url ? (
            <Image
              src={post.featuredImage.url}
              alt={post.featuredImage.alt || post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <PlaceholderImage category={category} />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {isNew && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                  New
                </span>
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-md">
                {category}
              </span>
            </div>
            <div className="w-8" />
          </div>

          {/* Title & Summary */}
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
        </div>
      </Link>
    </article>
  );
}
