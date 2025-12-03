"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArticleContent } from "@/components/ui/ArticleContent";
import { Header } from "@/components/ui/Header";
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = useQuery(api.posts.getBySlug, { slug });

  if (post === undefined) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Article not found</h1>
          <Link href="/" className="text-indigo-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 mb-8 transition-colors"
        >
          ← Back to feed
        </Link>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-500 pb-8 border-b border-slate-200">
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {format(post.publishedAt, "MMMM d, yyyy")}
            </time>
            <span>·</span>
            <span>{post.readingTime} min read</span>
          </div>
        </header>

        <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-slate-200">
          <ArticleContent content={post.content} />
        </div>

        <footer className="mt-12 p-6 bg-white rounded-2xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Sources
          </h3>
          <ul className="space-y-2">
            {post.sources.map((source: any, i: number) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-600 hover:text-indigo-600 transition-colors flex items-center gap-2"
                >
                  <span className="text-slate-400">{i + 1}.</span>
                  <span className="truncate">{source.title}</span>
                  <span className="text-slate-300">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </footer>
      </article>
    </div>
  );
}
