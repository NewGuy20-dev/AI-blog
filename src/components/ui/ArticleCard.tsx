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
            <article className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 group-hover:border-indigo-200">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                        {post.tags[0] || "News"}
                    </span>
                    <span className="text-xs text-gray-500">
                        {formatDistanceToNow(post.publishedAt, { addSuffix: true })}
                    </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                </h2>
                <p className="text-gray-600 line-clamp-3 mb-4">{post.summary}</p>
                <div className="flex items-center text-sm text-gray-500">
                    <span>{post.readingTime} min read</span>
                </div>
            </article>
        </Link>
    );
}
