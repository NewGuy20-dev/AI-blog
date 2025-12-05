"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { Header } from "@/components/ui/Header";
import { useBookmarks } from "@/lib/hooks/useBookmarks";
import Link from "next/link";

export default function BookmarksPage() {
  const { bookmarks } = useBookmarks();
  const posts = useQuery(api.posts.list, { limit: 100 });

  const bookmarkedPosts = posts?.filter((p: any) => bookmarks.includes(p.slug));

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
            ← Back to feed
          </Link>
          <h1 className="text-3xl font-bold mt-4">Bookmarks</h1>
          <p className="text-[var(--color-text-muted)] mt-2">Your saved articles</p>
        </div>

        {posts === undefined ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 bg-[var(--color-card)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : bookmarkedPosts?.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔖</div>
            <p className="text-[var(--color-text-muted)] text-lg">No bookmarks yet.</p>
            <Link href="/" className="text-[var(--color-primary)] hover:underline mt-2 inline-block">
              Browse articles
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookmarkedPosts?.map((post: any) => (
              <ArticleCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
