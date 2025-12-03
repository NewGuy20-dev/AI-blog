import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

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
  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="h-full p-6 bg-white rounded-2xl border border-slate-200 card-hover flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            {post.tags[0] || "AI"}
          </span>
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(post.publishedAt, { addSuffix: true })}
          </span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-slate-600 text-sm line-clamp-3 flex-1">{post.summary}</p>
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
          <span className="text-xs text-slate-400">{post.readingTime} min read</span>
          <span className="text-xs font-medium text-indigo-600 group-hover:translate-x-1 transition-transform">
            Read →
          </span>
        </div>
      </article>
    </Link>
  );
}
