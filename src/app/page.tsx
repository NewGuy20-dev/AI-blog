"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArticleCard } from "@/components/ui/ArticleCard";

export default function Home() {
  const posts = useQuery(api.posts.list, { limit: 20 });

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            AI<span className="text-indigo-600">News</span>
          </h1>
          <nav>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-600 hover:text-indigo-600"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4">
            Latest AI Updates
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Autonomous newsroom powered by Gemini 2.5 Flash Lite.
            Generating factual, verified updates every hour.
          </p>
        </div>

        {posts === undefined ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-white rounded-xl border border-gray-200 animate-pulse"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No posts yet. Trigger the pipeline!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1">
            {posts.map((post: any) => (
              <ArticleCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
