"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { Sidebar } from "@/components/ui/Sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/ui/UserMenu";

const INITIAL_COUNT = 6;
const LOAD_MORE_COUNT = 6;

export default function FeedPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const posts = useQuery(api.posts.list, { 
    limit: 100,
    category: selectedCategory ?? undefined,
  });

  const handleCategoryChange = (cat: string | null) => {
    setSelectedCategory(cat);
    setVisibleCount(INITIAL_COUNT);
  };

  const visiblePosts = posts?.slice(0, visibleCount);
  const hasMore = posts && posts.length > visibleCount;
  const totalCount = posts?.length || 0;

  return (
    <div className="flex min-h-screen">
      <Sidebar selectedCategory={selectedCategory} onSelectCategory={handleCategoryChange} />
      
      <div className="flex-1 min-h-screen">
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2">
          <ThemeToggle />
          <UserMenu position="top" />
        </div>
        
        {/* Header */}
        <header className="px-6 md:px-12 pt-12 pb-8 md:pt-16 md:pb-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {selectedCategory || "Discover"}
            </h1>
            <p className="text-[var(--color-text-muted)] text-lg">
              {selectedCategory 
                ? `${totalCount} article${totalCount !== 1 ? "s" : ""} in ${selectedCategory}`
                : "Your personalized news feed"
              }
            </p>
          </div>
        </header>

        {/* Content */}
        <main className="px-6 md:px-12 pb-16">
          {posts === undefined ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-52 rounded-2xl bg-[var(--color-border)]/30 animate-pulse" />
              ))}
            </div>
          ) : visiblePosts?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--color-text-muted)] text-lg">
                No articles found{selectedCategory ? ` in ${selectedCategory}` : ""}.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePosts?.map((post) => (
                  <ArticleCard key={post._id} post={post} />
                ))}
              </div>
              
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => setVisibleCount((c) => c + LOAD_MORE_COUNT)}
                    className="px-8 py-3 text-sm font-medium border border-[var(--color-border)] rounded-full hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all duration-200"
                  >
                    Load more articles
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
