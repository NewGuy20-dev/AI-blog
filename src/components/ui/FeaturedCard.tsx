import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Clock } from "lucide-react";

interface FeaturedCardProps {
  post: {
    slug: string;
    title: string;
    summary: string;
    publishedAt: number;
    readingTime: number;
    tags: string[];
  };
}

export function FeaturedCard({ post }: FeaturedCardProps) {
  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="p-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              Featured
            </span>
            <span className="text-xs font-semibold bg-white/20 px-3 py-1 rounded-full">
              {post.tags[0] || "General"}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:underline decoration-2 underline-offset-4">
            {post.title}
          </h2>
          <p className="text-white/80 mb-6 line-clamp-2 max-w-2xl">{post.summary}</p>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span>{formatDistanceToNow(post.publishedAt, { addSuffix: true })}</span>
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {post.readingTime} min read
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
