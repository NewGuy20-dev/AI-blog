"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { FeaturedCard } from "@/components/ui/FeaturedCard";
import { Header } from "@/components/ui/Header";
import { TagFilter } from "@/components/ui/TagFilter";
import { SearchBar } from "@/components/ui/SearchBar";
import { NewsletterSignup } from "@/components/ui/NewsletterSignup";
import { useKeyboardNav } from "@/lib/hooks/useKeyboardNav";

const INITIAL_LIMIT = 9;
const LOAD_MORE_COUNT = 6;

export default function Home() {
  const posts = useQuery(api.posts.list, { limit: 100 });
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_LIMIT);

  const allTags = useMemo(() => {
    if (!posts) return [];
    const tags = new Set<string>();
    posts.forEach((p: any) => p.tags.forEach((t: string) => tags.add(t)));
    return Array.from(tags).sort();
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return posts;
    let result = posts;
    if (selectedTag) {
      result = result.filter((p: any) => p.tags.includes(selectedTag));
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p: any) => 
        p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q)
      );
    }
    return result;
  }, [posts, selectedTag, search]);

  const featured = filteredPosts?.[0];
  const rest = filteredPosts?.slice(1);
  const showFeatured = !search && !selectedTag && featured;
  
  const displayPosts = showFeatured ? rest : filteredPosts;
  const visiblePosts = displayPosts?.slice(0, visibleCount);
  const hasMore = displayPosts && displayPosts.length > visibleCount;
  
  const slugs = visiblePosts?.map((p: any) => p.slug) || [];
  const { selectedIndex } = useKeyboardNav(slugs);

  const loadMore = () => setVisibleCount((c) => c + LOAD_MORE_COUNT);

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <Header />
      
      {/* Hero */}
      <section className="bg-[var(--color-card)] border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-[var(--color-primary)] text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live updates every hour
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight">
            AI <span className="gradient-text">News</span>
          </h1>
          <p className="text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto mb-8">
            Autonomous newsroom powered by AI. Curated, verified, and delivered fresh.
          </p>
          <div className="max-w-md mx-auto">
            <SearchBar value={search} onChange={setSearch} />
          </div>
        </div>
      </section>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pt-8">
          <TagFilter tags={allTags} selected={selectedTag} onSelect={setSelectedTag} />
        </div>
      )}

      {/* Articles */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {posts === undefined ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl skeleton" />
            ))}
          </div>
        ) : filteredPosts?.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-[var(--color-text-muted)] text-lg">
              {search ? `No results for "${search}"` : selectedTag ? `No articles tagged "${selectedTag}"` : "No articles yet."}
            </p>
          </div>
        ) : (
          <>
            {showFeatured && (
              <div className="mb-8 animate-fadeIn">
                <FeaturedCard post={featured} />
              </div>
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visiblePosts?.map((post: any, i: number) => (
                <div 
                  key={post._id} 
                  id={`article-${i}`}
                  className={`animate-fadeIn stagger-${Math.min(i + 1, 5)} ${selectedIndex === i ? "ring-2 ring-[var(--color-primary)] rounded-2xl" : ""}`} 
                  style={{ opacity: 0 }}
                >
                  <ArticleCard post={post} />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="text-center mt-10">
                <button
                  onClick={loadMore}
                  className="px-8 py-3 bg-[var(--color-primary)] text-white font-medium rounded-full hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  Load more articles
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Newsletter */}
      <div className="max-w-2xl mx-auto px-4 pb-12">
        <NewsletterSignup />
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-[var(--color-text-muted)]">
          Built with Next.js, Convex & Gemini · Auto-generated content · <span className="opacity-60">j/k to navigate</span>
        </div>
      </footer>
    </div>
  );
}
