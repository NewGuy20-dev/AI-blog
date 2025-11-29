"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArticleContent } from "@/components/ui/ArticleContent";
import { format } from "date-fns";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function PostPage() {
    const params = useParams();
    const slug = params.slug as string;
    const post = useQuery(api.posts.getBySlug, { slug });

    if (post === undefined) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (post === null) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
                <Link href="/" className="text-indigo-600 hover:underline">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <article className="max-w-3xl mx-auto px-4 py-12">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-8 transition-colors"
                >
                    ← Back to Feed
                </Link>

                <header className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        {post.tags.map((tag: string) => (
                            <span
                                key={tag}
                                className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-between text-gray-500 border-b border-gray-100 pb-8">
                        <div className="flex items-center gap-4">
                            <time dateTime={new Date(post.publishedAt).toISOString()}>
                                {format(post.publishedAt, "MMMM d, yyyy")}
                            </time>
                            <span>•</span>
                            <span>{post.readingTime} min read</span>
                        </div>
                    </div>
                </header>

                <ArticleContent content={post.content} />

                <footer className="mt-16 pt-8 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
                        Sources
                    </h3>
                    <ul className="space-y-2">
                        {post.sources.map((source: any, i: number) => (
                            <li key={i}>
                                <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-gray-600 hover:text-indigo-600 truncate block max-w-full"
                                >
                                    {i + 1}. {source.title}
                                </a>
                            </li>
                        ))}
                    </ul>
                </footer>
            </article>
        </main>
    );
}
