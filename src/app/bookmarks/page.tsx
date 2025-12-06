"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";
import { Bookmark, Trash2, ArrowLeft } from "lucide-react";

export default function BookmarksPage() {
  const { bookmarks, clear, count } = useBookmarks();
  const posts = useQuery(api.posts.list, { limit: 100 });

  const bookmarkedPosts = posts?.filter((p: any) => bookmarks.includes(p.slug));

  return (
    <div className="min-h-screen">
      <ThemeToggle />
      
      {/* Header */}
      <header className="px-6 md:px-12 pt-8 pb-6 flex items-center justify-between border-b border-[var(--color-border)]">
        <Logo />
        <Link 
          href="/" 
          className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back
        </Link>
      </header>

      {/* Title section */}
      <div className="px-6 md:px-12 pt-12 pb-8">
        <div className="max-w-4xl flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[var(--color-primary)]/10">
              <Bookmark size={24} strokeWidth={1.5} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Bookmarks</h1>
              <p className="text-[var(--color-text-muted)] mt-1">
                {count === 0 ? "No saved articles" : `${count} saved article${count !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          
          {count > 0 && (
            <button
              onClick={clear}
              className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={16} strokeWidth={1.5} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="px-6 md:px-12 pb-16">
        {posts === undefined ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-52 rounded-2xl bg-[var(--color-border)]/30 animate-pulse" />
            ))}
          </div>
        ) : bookmarkedPosts?.length === 0 ? (
          <div className="max-w-md py-16 text-center mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-border)]/30 flex items-center justify-center mx-auto mb-6">
              <Bookmark size={28} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
            </div>
            <p className="text-[var(--color-text-muted)] mb-6">
              Articles you bookmark will appear here
            </p>
            <Link 
              href="/" 
              className="inline-flex px-6 py-2.5 text-sm font-medium bg-[var(--color-primary)] text-white rounded-full hover:opacity-90 transition-opacity"
            >
              Browse articles
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl">
            {bookmarkedPosts?.map((post: any) => (
              <ArticleCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
