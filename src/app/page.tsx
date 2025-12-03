"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ArticleCard } from "@/components/ui/ArticleCard";
import { Header } from "@/components/ui/Header";

export default function Home() {
  const posts = useQuery(api.posts.list, { limit: 20 });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live updates every hour
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-4 tracking-tight">
            AI <span className="gradient-text">News</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Autonomous newsroom powered by AI. Curated, verified, and delivered fresh.
          </p>
        </div>
      </section>

      {/* Articles */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        {posts === undefined ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-72 bg-white rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📰</div>
            <p className="text-slate-500 text-lg">No articles yet. First batch coming soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: any) => (
              <ArticleCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-500">
          Built with Next.js, Convex & Gemini · Auto-generated content
        </div>
      </footer>
    </div>
  );
}
