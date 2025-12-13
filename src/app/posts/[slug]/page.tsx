"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { ArticleContent } from "@/components/ui/ArticleContent";
import { Header } from "@/components/ui/Header";
import { format } from "date-fns";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ReadingProgress } from "@/components/ui/ReadingProgress";
import { ShareButtons } from "@/components/ui/ShareButtons";
import { RelatedArticles } from "@/components/ui/RelatedArticles";
import { TableOfContents } from "@/components/ui/TableOfContents";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const post = useQuery(api.posts.getBySlug, { slug });

  if (post === undefined) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        <Header />
        <div className="flex flex-col items-center justify-center py-32">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">Article not found</h1>
          <Link href="/" className="text-[var(--color-primary)] hover:underline">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <ReadingProgress />
      <Header />
      
      <article className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          onClick={(e) => {
            e.preventDefault();
            router.back();
          }}
          className="inline-flex items-center text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] mb-8 transition-colors"
        >
          ← Back to feed
        </Link>

        <header className="mb-10">
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="text-sm font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-between gap-4 text-sm text-[var(--color-text-muted)] pb-8 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-4">
              <time dateTime={new Date(post.publishedAt).toISOString()}>
                {format(post.publishedAt, "MMMM d, yyyy")}
              </time>
              <span>·</span>
              <span>{post.readingTime} min read</span>
            </div>
            <ShareButtons title={post.title} slug={slug} />
          </div>
        </header>

        {post.featuredImage && (
          <figure className="mb-10 -mx-4 md:mx-0">
            <img
              src={post.featuredImage.url}
              alt={post.featuredImage.alt}
              className="w-full rounded-xl object-cover max-h-96"
            />
            {post.featuredImage.attribution && (
              <figcaption className="mt-2 text-xs text-[var(--color-text-muted)] text-center">
                Photo{post.featuredImage.attribution.creator && (
                  <> by{" "}
                    {post.featuredImage.attribution.creatorUrl ? (
                      <a href={post.featuredImage.attribution.creatorUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-primary)]">
                        {post.featuredImage.attribution.creator}
                      </a>
                    ) : post.featuredImage.attribution.creator}
                  </>
                )}
                {" / "}
                {post.featuredImage.attribution.licenseUrl ? (
                  <a href={post.featuredImage.attribution.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-primary)]">
                    {post.featuredImage.attribution.license}
                  </a>
                ) : post.featuredImage.attribution.license}
                {" via "}
                <a href={post.featuredImage.attribution.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-primary)]">
                  {post.featuredImage.attribution.source}
                </a>
              </figcaption>
            )}
          </figure>
        )}

        <TableOfContents content={post.content} />

        <div className="bg-[var(--color-card)] rounded-2xl p-8 md:p-12 shadow-sm border border-[var(--color-border)]">
          <ArticleContent content={post.content} />
        </div>

        <footer className="mt-12 p-6 bg-[var(--color-card)] rounded-2xl border border-[var(--color-border)]">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4">
            Sources
          </h3>
          <ul className="space-y-2">
            {post.sources.map((source: any, i: number) => (
              <li key={i}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors flex items-center gap-2"
                >
                  <span className="opacity-50">{i + 1}.</span>
                  <span className="truncate">{source.title}</span>
                  <span className="opacity-30">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </footer>

        <RelatedArticles slug={slug} tags={post.tags} />
      </article>
    </div>
  );
}
