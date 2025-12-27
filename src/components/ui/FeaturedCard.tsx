import Link from "next/link";
import Image from "next/image";
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
    featuredImage?: { url: string; alt: string } | null;
  };
}

export function FeaturedCard({ post }: FeaturedCardProps) {
  return (
    <Link href={`/posts/${post.slug}`} className="block group">
      <article className="relative rounded-2xl text-white overflow-hidden min-h-[280px]">
        {post.featuredImage?.url ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.alt || post.title}
            fill
            className="object-cover"
          />
        ) : null}
        <div className={`absolute inset-0 ${post.featuredImage?.url ? "bg-gradient-to-t from-black/80 via-black/40 to-black/20" : "bg-gradient-to-br from-indigo-500 to-purple-600"}`} />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        <div className="relative z-10 p-8 flex flex-col justify-end h-full">
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
